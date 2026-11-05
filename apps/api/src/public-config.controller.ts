import { Controller, Get, Header } from '@nestjs/common';

@Controller('public-config')
export class PublicConfigController {
  @Get()
  @Header('Cache-Control', 'no-store')
  getConfig() {
    return { primeNgLicenseKey: process.env['PRIMENG_LICENSE_KEY'] ?? '' };
  }
}
