import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { SessionAuthGuard } from '../auth/session-auth.guard';
import {
  parseContractorId,
  parseContractorQuery,
  parseStatusInput,
} from './admin.input';
import { AdminService } from './admin.service';

@Controller('admin')
@UseGuards(SessionAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('overview')
  getOverview() {
    return this.adminService.getOverview();
  }

  @Get('contractors')
  getContractors(@Query() query: unknown) {
    return this.adminService.getContractors(parseContractorQuery(query));
  }

  @Patch('contractors/:id/status')
  setContractorStatus(@Param('id') id: string, @Body() body: unknown) {
    return this.adminService.setContractorStatus(
      parseContractorId(id),
      parseStatusInput(body).isActive,
    );
  }
}
