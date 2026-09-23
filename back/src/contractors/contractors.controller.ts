import { Controller, Get, Param, Query } from '@nestjs/common';
import { ContractorsService } from './contractors.service';
import { ListContractorsQueryDto } from './dto/list-contractors.query.dto';

@Controller('contractors')
export class ContractorsController {
  constructor(private readonly contractorsService: ContractorsService) {}

  @Get()
  list(@Query() query: ListContractorsQueryDto) {
    return this.contractorsService.list(query);
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.contractorsService.getById(id);
  }
}
