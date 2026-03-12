import { Controller, Get, Post, Body, Param, Delete, ParseUUIDPipe } from '@nestjs/common';
import { MediaService } from './media.service';
import { CreateImageDto } from './dto/create-image.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('media')
@Controller('media')
export class MediaController {
    constructor(private readonly mediaService: MediaService) { }

    @Post('images')
    @ApiOperation({ summary: 'Create a new image record' })
    create(@Body() createImageDto: CreateImageDto) {
        return this.mediaService.create(createImageDto);
    }

    @Get('images')
    @ApiOperation({ summary: 'Get all image records' })
    findAll() {
        return this.mediaService.findAll();
    }

    @Get('images/:id')
    @ApiOperation({ summary: 'Get an image record by ID' })
    findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.mediaService.findOne(id);
    }

    @Delete('images/:id')
    @ApiOperation({ summary: 'Delete an image record' })
    remove(@Param('id', ParseUUIDPipe) id: string) {
        return this.mediaService.remove(id);
    }

    // === IMAGE TAGS ===

    @Post('images/:id/tag/:userId')
    @ApiOperation({ summary: 'Tag a user in an image' })
    tagUser(
        @Param('id', ParseUUIDPipe) id: string,
        @Param('userId', ParseUUIDPipe) userId: string
    ) {
        return this.mediaService.tagUser(id, userId);
    }

    @Delete('images/:id/tag/:userId')
    @ApiOperation({ summary: 'Untag a user from an image' })
    untagUser(
        @Param('id', ParseUUIDPipe) id: string,
        @Param('userId', ParseUUIDPipe) userId: string
    ) {
        return this.mediaService.untagUser(id, userId);
    }

    @Get('images/:id/tags')
    @ApiOperation({ summary: 'Get all tags for an image' })
    findTagsByImage(@Param('id', ParseUUIDPipe) id: string) {
        return this.mediaService.findTagsByImage(id);
    }
}
