import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../prisma/prisma.module';
import { AdminController } from './admin.controller';

@Module({
  imports: [PrismaModule, ConfigModule],
  controllers: [AdminController],
  exports: [],
})
export class AdminModule {}
