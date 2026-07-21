import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  index() {
    return {
      welcome: 'API de E-commerce funcionando!',
    };
  }
}
