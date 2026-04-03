import { Controller, Get } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('analytics')
@Controller('analytics')
export class AnalyticsController {
    constructor(private readonly analyticsService: AnalyticsService) { }

    @Get('dashboard')
    @ApiOperation({ summary: 'Get admin dashboard analytics' })
    getDashboard() {
        return this.analyticsService.getDashboard();
    }
}
