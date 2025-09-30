import { Controller, Get, Post, Body, Patch, Param, Delete, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { BooksService } from './books.service';
import { CreateBookDto } from './dto/createBookDto';
import { UpdateBookDto } from './dto/updateBookDto';

@Controller('books')
export class BooksController {
    constructor(private readonly booksService: BooksService) { }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    create(@Body() createBookDto: CreateBookDto) {
        return this.booksService.create(createBookDto);
    }

    @Get()
    findAll() {
        return this.booksService.findAll();
    }

    @Get('search/title')
    findByTitle(@Query('title') title: string) {
        return this.booksService.findByTitle(title);
    }

    @Get('search/tags')
    findByTags(@Query('tags') tags: string) {
        const tagsArray = tags.split(',').map(tag => tag.trim());
        return this.booksService.findByTags(tagsArray);
    }

    @Get('query')
    findMany(@Query() query: Object) {
        return this.booksService.findMany(query);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.booksService.findOne(id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateBookDto: UpdateBookDto) {
        return this.booksService.updateOne(id, updateBookDto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    remove(@Param('id') id: string) {
        return this.booksService.deleteOne(id);
    }
}
