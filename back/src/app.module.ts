import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ContractorsModule } from './contractors/contractors.module';
import { HealthModule } from './health/health.module';
import { MatchingModule } from './matching/matching.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    HealthModule,
    ContractorsModule,
    MatchingModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
