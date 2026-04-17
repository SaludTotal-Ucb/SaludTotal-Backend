import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HistorialModule } from './modules/historial/historial.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    HistorialModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
