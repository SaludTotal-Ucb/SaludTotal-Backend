import { Injectable } from '@nestjs/common';

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
