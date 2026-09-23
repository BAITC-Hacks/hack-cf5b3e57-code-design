import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { parseLoginInput } from './auth.input';
import type { AuthenticatedRequest } from './auth.types';
import { SessionAuthGuard } from './session-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(@Body() body: unknown) {
    return this.authService.login(parseLoginInput(body));
  }

  @Get('me')
  @UseGuards(SessionAuthGuard)
  me(@Req() request: AuthenticatedRequest) {
    if (!request.user) {
      throw new UnauthorizedException('Authentication is required');
    }
    return { user: request.user };
  }
}
