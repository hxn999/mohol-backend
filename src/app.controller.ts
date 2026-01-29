import { Controller, Get } from '@nestjs/common';
import { AppService, UsersResponse } from './app.service';
import { ConnectionStatus } from './database/database.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('db/status')
  async getDbStatus(): Promise<ConnectionStatus> {
    return this.appService.getDbStatus();
  }

  @Get('db/users')
  async getAllUsers(): Promise<UsersResponse> {
    return this.appService.getAllUsers();
  }
}
