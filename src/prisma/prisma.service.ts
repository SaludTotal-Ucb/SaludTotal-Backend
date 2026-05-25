import { Injectable } from '@nestjs/common';
import type { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
//sirve para comunicar con la bd, pasicamente prisma hace la tarduccion de lo que queremos hacer en la bd a codigo sql y lo ejecuta, y viseversa
//si no hay se crashea el codigo, no habra conexion a la bd y ademas seria un codigo desordenado
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
