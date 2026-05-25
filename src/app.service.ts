import { Injectable } from '@nestjs/common';
//se mandan al app controller si la api esta levantada
@Injectable()
export class AppService {
  getStatus() {
    return {
      service: 'SaludTotal Backend (monolito)',
      status: 'UP',
      timestamp: new Date().toISOString(),
    };
  }
}
