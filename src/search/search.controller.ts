import { Controller, Get, Query, ParseIntPipe, BadRequestException } from '@nestjs/common';
import { SearchService } from './search.service';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';

@ApiTags('search')
@Controller('search')
export class SearchController {
    constructor(private readonly searchService: SearchService) { }

    @Get()
    @ApiOperation({ summary: 'Global search for users, groups, and posts' })
    @ApiQuery({ name: 'q', description: 'Search query' })
    @ApiQuery({ name: 'userId', description: 'ID of the user performing the search' })
    async search(
        @Query('q') query: string,
        @Query('userId', ParseIntPipe) userId: number
    ) {
        if (!query || query.length < 2) {
            throw new BadRequestException('Search query must be at least 2 characters long');
        }
        return this.searchService.searchAll(query, userId);
    }

    @Get('suggestions')
    @ApiOperation({ summary: 'Get search suggestions for autocomplete' })
    @ApiQuery({ name: 'q', description: 'Search query' })
    async getSuggestions(@Query('q') query: string) {
        if (!query || query.length < 1) {
            return [];
        }
        return this.searchService.getSuggestions(query);
    }
}
