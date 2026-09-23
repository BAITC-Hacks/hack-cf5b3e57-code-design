import { Injectable, NotFoundException } from '@nestjs/common';
import { Contractor as ContractorModel, Prisma } from '@prisma/client';
import type {
  AdminContractor,
  AdminContractorsResponse,
  AdminOverviewResponse,
  UpdateContractorStatusResponse,
} from '../../../shared/contract';
import { PrismaService } from '../prisma/prisma.service';
import { ContractorQuery } from './admin.input';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview(): Promise<AdminOverviewResponse> {
    const contractors = await this.prisma.contractor.findMany({
      select: {
        city: true,
        categories: true,
        isActive: true,
        synthetic: true,
        cityImputed: true,
        priceImputed: true,
        priceFromKzt: true,
        maxHours: true,
      },
    });

    const byCity = new Map<string, number>();
    const byCategory = new Map<string, number>();
    let activeContractors = 0;
    let syntheticContractors = 0;
    let cityImputedContractors = 0;
    let priceImputedContractors = 0;
    let missingMaxHoursContractors = 0;
    let priceTotal = 0;

    for (const contractor of contractors) {
      if (contractor.isActive) activeContractors += 1;
      if (contractor.synthetic) syntheticContractors += 1;
      if (contractor.cityImputed) cityImputedContractors += 1;
      if (contractor.priceImputed) priceImputedContractors += 1;
      if (contractor.maxHours === null) missingMaxHoursContractors += 1;
      priceTotal += contractor.priceFromKzt;
      byCity.set(contractor.city, (byCity.get(contractor.city) ?? 0) + 1);
      for (const category of contractor.categories) {
        byCategory.set(category, (byCategory.get(category) ?? 0) + 1);
      }
    }

    const prices = contractors.map((contractor) => contractor.priceFromKzt);
    return {
      totalContractors: contractors.length,
      activeContractors,
      inactiveContractors: contractors.length - activeContractors,
      syntheticContractors,
      cityImputedContractors,
      priceImputedContractors,
      missingMaxHoursContractors,
      priceFromKzt: {
        min: prices.length ? Math.min(...prices) : null,
        max: prices.length ? Math.max(...prices) : null,
        average: prices.length ? Math.round(priceTotal / prices.length) : null,
      },
      byCity: this.sortedCounts(byCity),
      byCategory: this.sortedCounts(byCategory),
    };
  }

  async getContractors(
    query: ContractorQuery,
  ): Promise<AdminContractorsResponse> {
    const where: Prisma.ContractorWhereInput = {};
    if (query.search) {
      where.OR = [
        { id: { contains: query.search, mode: 'insensitive' } },
        { anonName: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.city) where.city = query.city;
    if (query.category) where.categories = { has: query.category };
    if (query.status !== 'all') {
      where.isActive = query.status === 'active';
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.contractor.findMany({
        where,
        orderBy: [{ anonName: 'asc' }, { id: 'asc' }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.contractor.count({ where }),
    ]);

    return {
      items: items.map((contractor) => this.toAdminContractor(contractor)),
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: Math.ceil(total / query.pageSize),
      },
    };
  }

  async setContractorStatus(
    id: string,
    isActive: boolean,
  ): Promise<UpdateContractorStatusResponse> {
    const update = await this.prisma.contractor.updateMany({
      where: { id },
      data: { isActive },
    });
    if (update.count === 0) {
      throw new NotFoundException(`Contractor ${id} was not found`);
    }
    const contractor = await this.prisma.contractor.findUnique({
      where: { id },
    });
    if (!contractor) {
      throw new NotFoundException(`Contractor ${id} was not found`);
    }
    return { contractor: this.toAdminContractor(contractor) };
  }

  private toAdminContractor(contractor: ContractorModel): AdminContractor {
    return {
      ...contractor,
      createdAt: contractor.createdAt.toISOString(),
      updatedAt: contractor.updatedAt.toISOString(),
    };
  }

  private sortedCounts(counts: Map<string, number>) {
    return [...counts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((left, right) =>
        right.count === left.count
          ? left.name.localeCompare(right.name, 'ru')
          : right.count - left.count,
      );
  }
}
