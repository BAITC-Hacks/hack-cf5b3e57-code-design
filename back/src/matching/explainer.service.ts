import { Inject, Injectable, Logger } from '@nestjs/common';
import { createHash } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { criteriaFor } from './criteria';
import { MatchRequestDto } from './dto/match-request.dto';
import {
  availabilityOnlyOption,
  Candidate,
  composeReason,
  evidenceFor,
  factsFor,
} from './evidence';
import type { EvidenceOption, ExplainInput, LlmClient } from './llm/llm-client';
import { LLM_CLIENT } from './llm/llm-client';
import type { MatchCard } from './types';

const CACHE_VERSION = 5;
const GENERIC = /отличн(?:ый|о)|идеальн|прекрасн|лучший|профессионал своего дела|для вашего мероприятия/iu;

interface Draft {
  candidate: Candidate;
  options: EvidenceOption[];
  selected: EvidenceOption;
  request: MatchRequestDto;
  fromCache: boolean;
  initialProblem?: string;
}

interface CriticResult {
  ok: boolean;
  problems: { id: string; problem: string }[];
}

@Injectable()
export class ExplainerService {
  private readonly logger = new Logger(ExplainerService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(LLM_CLIENT) private readonly llm: LlmClient,
  ) {}

  /** The model selects a source-backed clause; it cannot write claims. */
  async build(
    orderedIds: string[],
    req: MatchRequestDto,
    criteria: string[],
  ): Promise<{ cards: MatchCard[]; critic: CriticResult; omittedForEvidence: number }> {
    const top = orderedIds.slice(0, 3);
    if (top.length === 0) return {
      cards: [], critic: { ok: true, problems: [] }, omittedForEvidence: 0,
    };

    const rows = await this.prisma.contractor.findMany({
      where: { id: { in: top } },
      include: { enrichment: true },
    });
    rows.sort((a, b) => top.indexOf(a.id) - top.indexOf(b.id));
    const requestHash = this.hashRequest(req, rows);
    const locale = req.locale ?? 'ru';
    const cached = await this.prisma.explanationCache.findMany({
      where: {
        requestHash,
        locale,
        version: CACHE_VERSION,
        contractorId: { in: top },
      },
    });
    const cacheById = new Map(cached.map((item) => [item.contractorId, item]));

    const drafts = await Promise.all(rows.map(async (candidate): Promise<Draft> => {
      const options = evidenceFor(candidate, rows, req);
      if (options.length === 0) throw new Error(`no evidence for ${candidate.id}`);
      const cachedReason = cacheById.get(candidate.id)?.reason;
      const cachedOption = [...options, availabilityOnlyOption(candidate, req)].find(
        (option) => composeReason(option, candidate, req) === cachedReason,
      );
      if (cachedOption) {
        return { candidate, options, selected: cachedOption, request: req, fromCache: true };
      }
      const chosen = await this.select(candidate, options, req, criteria);
      return {
        candidate,
        options,
        selected: chosen ?? options[0],
        request: req,
        fromCache: false,
        initialProblem: chosen ? undefined : 'unsupported_selection',
      };
    }));

    const initialProblems = drafts
      .filter((draft) => draft.initialProblem)
      .map((draft) => ({ id: draft.candidate.id, problem: draft.initialProblem! }));
    let review = await this.review(drafts, initialProblems, drafts.every((draft) => draft.fromCache));

    if (!review.ok) {
      const affected = new Set(review.problems.map((problem) => problem.id));
      await Promise.all(drafts.filter((draft) => affected.has(draft.candidate.id)).map(async (draft) => {
        const alternatives = draft.options.filter((option) => option.id !== draft.selected.id);
        if (alternatives.length === 0) return;
        const chosen = await this.select(
          draft.candidate,
          alternatives,
          req,
          criteria,
          review.problems
            .filter((problem) => problem.id === draft.candidate.id)
            .map((problem) => problem.problem),
        );
        draft.selected = chosen ?? alternatives[0];
        draft.fromCache = false;
      }));
      review = await this.review(drafts);
    }

    let omittedForEvidence = 0;
    if (!review.ok) {
      // Exactly one retry was attempted. The final fallback contains only
      // code-rendered facts, even when the LLM or critic is adversarial.
      this.logger.warn(`critic rejected drafts; fact-only fallback: ${JSON.stringify(review.problems)}`);
      const safe = this.chooseDistinctFallback(drafts);
      omittedForEvidence = drafts.length - safe.length;
      drafts.splice(0, drafts.length, ...safe);
      review = this.localReview(drafts);
    }

    if (!review.ok) throw new Error('no fully verified explanation could be formed');

    const cards = drafts.map((draft) => this.cardFor(draft));
    if (review.ok) {
      await Promise.all(drafts.filter((draft) => !draft.fromCache).map(async (draft) => {
        try {
          await this.prisma.explanationCache.create({
            data: {
              requestHash,
              contractorId: draft.candidate.id,
              locale,
              version: CACHE_VERSION,
              reason: composeReason(draft.selected, draft.candidate, req),
              factsUsed: [...new Set([...draft.selected.factKeys, 'date', 'budget'])],
            },
          });
        } catch (error) {
          // A concurrent identical request may win the unique key.
          this.logger.warn(`cache write failed for ${draft.candidate.id}: ${(error as Error).message}`);
        }
      }));
    }
    return { cards, critic: review, omittedForEvidence };
  }

  private async select(
    candidate: Candidate,
    options: EvidenceOption[],
    req: MatchRequestDto,
    criteria: string[],
    feedback?: string[],
  ): Promise<EvidenceOption | null> {
    const input: ExplainInput = {
      criteria,
      request: req,
      candidate: {
        id: candidate.id,
        anonName: candidate.anonName,
        priceFromKzt: candidate.priceFromKzt,
        languages: candidate.languages,
        eventFormats: candidate.eventFormats,
        maxHours: candidate.maxHours,
        description: candidate.description,
        signals: candidate.enrichment?.signals ?? [],
        specialization: candidate.enrichment?.specialization ?? null,
      },
      options,
      feedback,
    };
    try {
      const output = await this.llm.explain(input);
      return options.find((item) => item.id === output.selectedId) ?? null;
    } catch (error) {
      this.logger.warn(`explanation selection failed for ${candidate.id}: ${(error as Error).message}`);
      return null;
    }
  }

  private async review(
    drafts: Draft[],
    extraProblems: CriticResult['problems'] = [],
    allCached = false,
  ): Promise<CriticResult> {
    const local = this.localReview(drafts);
    if (allCached && local.ok && extraProblems.length === 0) return local;
    let model: CriticResult;
    try {
      model = await this.llm.critic(drafts.map((draft) => {
        const card = this.cardFor(draft);
        return { id: card.id, reason: card.reason, facts: card.factsUsed };
      }));
    } catch (error) {
      this.logger.warn(`model critic failed: ${(error as Error).message}`);
      model = { ok: true, problems: [] };
    }
    const knownIds = new Set(drafts.map((draft) => draft.candidate.id));
    const modelProblems = model.problems.filter((item) => knownIds.has(item.id));
    if (!model.ok && modelProblems.length === 0) {
      modelProblems.push(...drafts.map((draft) => ({ id: draft.candidate.id, problem: 'critic_rejected' })));
    }
    const problems = [...extraProblems, ...local.problems, ...modelProblems];
    return { ok: problems.length === 0, problems };
  }

  private localReview(drafts: Draft[]): CriticResult {
    const problems: CriticResult['problems'] = [];
    const firstSentences = new Map<string, string>();
    for (const draft of drafts) {
      const reason = composeReason(draft.selected, draft.candidate, draft.request);
      if (reason.length > 220 || GENERIC.test(reason)) {
        problems.push({ id: draft.candidate.id, problem: 'generic_or_too_long' });
      }
      if (draft.candidate.busyDates.includes(draft.request.date)) {
        problems.push({ id: draft.candidate.id, problem: 'unavailable' });
      }
      const first = draft.selected.text.toLocaleLowerCase('ru-RU').replace(/\s+/gu, ' ').trim();
      const previous = firstSentences.get(first);
      if (previous) {
        problems.push({ id: previous, problem: 'interchangeable' });
        problems.push({ id: draft.candidate.id, problem: 'interchangeable' });
      } else firstSentences.set(first, draft.candidate.id);
      if (!factsFor(draft.selected, draft.candidate, draft.request).some((fact) => fact.verified)) {
        problems.push({ id: draft.candidate.id, problem: 'no_verified_facts' });
      }
    }
    return { ok: problems.length === 0, problems };
  }

  private chooseDistinctFallback(drafts: Draft[]): Draft[] {
    const safe: Draft[] = [];
    for (const draft of drafts) {
      for (const option of [
        ...draft.options,
        availabilityOnlyOption(draft.candidate, draft.request),
      ]) {
        const proposal = { ...draft, selected: option, fromCache: false };
        if (this.localReview([...safe, proposal]).ok) {
          safe.push(proposal);
          break;
        }
      }
    }
    return safe;
  }

  private cardFor(draft: Draft): MatchCard {
    const candidate = draft.candidate;
    const req = draft.request;
    return {
      id: candidate.id,
      anonName: candidate.anonName,
      category: req.category,
      city: candidate.city,
      priceFromKzt: candidate.priceFromKzt,
      reason: composeReason(draft.selected, candidate, req),
      factsUsed: factsFor(draft.selected, candidate, req),
      flags: {
        synthetic: candidate.synthetic,
        priceImputed: candidate.priceImputed,
        cityImputed: candidate.cityImputed,
      },
    };
  }

  private hashRequest(req: MatchRequestDto, rows: Candidate[]): string {
    const relevant = JSON.stringify({
      version: CACHE_VERSION,
      request: {
        city: req.city,
        date: req.date,
        eventType: req.eventType,
        category: req.category,
        budgetKzt: req.budgetKzt,
        durationHours: req.durationHours ?? null,
        language: req.language ?? null,
        locale: req.locale ?? 'ru',
      },
      shown: rows.map((row) => ({
        id: row.id,
        city: row.city,
        priceFromKzt: row.priceFromKzt,
        priceImputed: row.priceImputed,
        eventFormats: row.eventFormats,
        languages: row.languages,
        maxHours: row.maxHours,
        busyDates: row.busyDates,
        description: row.description,
      })),
      criteria: criteriaFor(req).map((item) => item.key),
    });
    return createHash('sha256').update(relevant).digest('hex').slice(0, 32);
  }
}
