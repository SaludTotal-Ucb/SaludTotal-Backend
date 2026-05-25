import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AdminModule } from './modules/admin/admin.module';
import { AuthModule } from './modules/auth/auth.module';
import { CitasModule } from './modules/citas/citas.module';
import { HealthController } from './modules/health/health.controller';
import { HistorialModule } from './modules/historial/historial.module';
import { PrismaModule } from './prisma/prisma.module';
//punto de arranque, cimiento de los modulos, aca mandamos el .env
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    HistorialModule,
    AuthModule,
    CitasModule,
    AdminModule,
  ],
  controllers: [AppController, HealthController],
  providers: [AppService],
})
export class AppModule {}
