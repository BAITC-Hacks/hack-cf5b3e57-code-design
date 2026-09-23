import { MatchRequestDto } from '../dto/match-request.dto';
import { FunnelStep } from '../types';
import { eventAcc, humanDate, languageLoc, money } from './nouns';

/** Причины отсева в порядке воронки; шаги без отсева не показываем. */
export function summarizeCauses(
  funnel: FunnelStep[],
  req: MatchRequestDto,
): string {
  const phrases: string[] = [];

  for (const step of funnel) {
    const count = step.before - step.after;
    if (count <= 0) continue;

    switch (step.step) {
      case 'date':
        phrases.push(`${count} заняты ${humanDate(req.date)}`);
        break;
      case 'format':
        phrases.push(`${count} не берут ${eventAcc(req.eventType)}`);
        break;
      case 'budget':
        phrases.push(`${count} дороже ${money(req.budgetKzt)}`);
        break;
      case 'language':
        if (req.language) {
          phrases.push(`${count} не работают на ${languageLoc(req.language)}`);
        }
        break;
      case 'hours':
        if (req.durationHours) {
          phrases.push(`${count} работают меньше ${req.durationHours} ч`);
        }
        break;
      case 'city':
      case 'category':
        break;
    }
  }

  return phrases.join(', ');
}
