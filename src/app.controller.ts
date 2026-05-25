import { Controller, Get, Inject } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(@Inject(AppService) private readonly appService: AppService) {}

  @Get()
  getRoot() {
    return this.appService.getStatus();
  }
}
//sirve para entrar a la pagina principal y ver si la api esta corriendo
