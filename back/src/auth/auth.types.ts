import { Request } from 'express';
import type { AuthUser } from '../../../shared/contract';

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}
