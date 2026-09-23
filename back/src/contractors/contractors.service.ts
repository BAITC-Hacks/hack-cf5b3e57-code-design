import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ListContractorsQueryDto } from './dto/list-contractors.query.dto';

const listSelect = {
  id: true,
  anonName: true,
  categories: true,
  city: true,
  priceFromKzt: true,
  eventFormats: true,
  languages: true,
  maxHours: true,
  synthetic: true,
  priceImputed: true,
  cityImputed: true,
} satisfies Prisma.ContractorSelect;

type ContractorListRecord = Prisma.ContractorGetPayload<{
  select: typeof listSelect;
}>;

@Injectable()
export class ContractorsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListContractorsQueryDto) {
    const {
      city,
      category,
      eventFormat,
      language,
      priceMin,
      priceMax,
      limit,
      offset,
    } = query;
    const where: Prisma.ContractorWhereInput = {
      ...(city && { city }),
      ...(category && { categories: { has: category } }),
      ...(eventFormat && { eventFormats: { has: eventFormat } }),
      ...(language && { languages: { has: language } }),
      ...((priceMin !== undefined || priceMax !== undefined) && {
        priceFromKzt: {
          ...(priceMin !== undefined && { gte: priceMin }),
          ...(priceMax !== undefined && { lte: priceMax }),
        },
      }),
    };

    const [contractors, total] = await Promise.all([
      this.prisma.contractor.findMany({
        where,
        select: listSelect,
        orderBy: [{ priceFromKzt: 'asc' }, { id: 'asc' }],
        take: limit,
        skip: offset,
      }),
      this.prisma.contractor.count({ where }),
    ]);

    return {
      items: contractors.map((contractor) => this.toListItem(contractor)),
      total,
      limit,
      offset,
    };
  }

  async getById(id: string) {
    const contractor = await this.prisma.contractor.findUnique({
      where: { id },
      select: {
        ...listSelect,
        description: true,
        busyDates: true,
      },
    });

    if (!contractor) {
      throw new NotFoundException(`Contractor ${id} not found`);
    }

    return {
      ...this.toListItem(contractor),
      description: contractor.description,
      busyDates: contractor.busyDates,
    };
  }

  private toListItem(contractor: ContractorListRecord) {
    const {
      synthetic,
      priceImputed,
      cityImputed,
      ...contractorListItem
    } = contractor;

    return {
      ...contractorListItem,
      flags: { synthetic, priceImputed, cityImputed },
    };
  }
}
