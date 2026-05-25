import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
//sirve para que todos los modulos puedan editar la bd y se pueda llamar a prisma, si quitamos el back deja de funcionar
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
