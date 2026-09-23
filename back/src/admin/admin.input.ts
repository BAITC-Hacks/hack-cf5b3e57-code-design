import { BadRequestException } from '@nestjs/common';
import type {
  AdminContractorsQuery,
  AdminContractorStatus,
  UpdateContractorStatusRequest,
} from '../../../shared/contract';

export type ContractorQuery = AdminContractorsQuery;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function optionalQueryString(
  query: Record<string, unknown>,
  key: string,
  maxLength: number,
): string | undefined {
  const value = query[key];
  if (value === undefined || value === '') return undefined;
  if (typeof value !== 'string' || value.length > maxLength) {
    throw new BadRequestException(
      `${key} must be a string of at most ${maxLength} characters`,
    );
  }
  const normalized = value.trim();
  return normalized || undefined;
}

function positiveIntegerQuery(
  query: Record<string, unknown>,
  key: string,
  fallback: number,
  maximum: number,
): number {
  const value = query[key];
  if (value === undefined || value === '') return fallback;
  if (typeof value !== 'string' || !/^\d+$/.test(value)) {
    throw new BadRequestException(`${key} must be a positive integer`);
  }
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1 || parsed > maximum) {
    throw new BadRequestException(`${key} must be between 1 and ${maximum}`);
  }
  return parsed;
}

export function parseContractorQuery(value: unknown): ContractorQuery {
  if (!isRecord(value)) {
    throw new BadRequestException('Query parameters are invalid');
  }

  const rawStatus = value.status;
  let status: AdminContractorStatus = 'all';
  if (rawStatus !== undefined && rawStatus !== '') {
    if (
      rawStatus !== 'all' &&
      rawStatus !== 'active' &&
      rawStatus !== 'inactive'
    ) {
      throw new BadRequestException(
        'status must be one of: all, active, inactive',
      );
    }
    status = rawStatus;
  }

  return {
    search: optionalQueryString(value, 'search', 200),
    city: optionalQueryString(value, 'city', 100),
    category: optionalQueryString(value, 'category', 100),
    status,
    page: positiveIntegerQuery(value, 'page', 1, 1_000_000),
    pageSize: positiveIntegerQuery(value, 'pageSize', 20, 100),
  };
}

export function parseStatusInput(
  value: unknown,
): UpdateContractorStatusRequest {
  if (!isRecord(value) || typeof value.isActive !== 'boolean') {
    throw new BadRequestException('isActive must be a boolean');
  }
  return { isActive: value.isActive };
}

export function parseContractorId(value: string): string {
  if (!/^HK-\d{5}$/.test(value)) {
    throw new BadRequestException('contractor id must match HK-12345');
  }
  return value;
}
