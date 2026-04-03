import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, UseInterceptors, UploadedFiles, Query } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { PostService } from './post.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';

@ApiTags('posts')
@Controller('posts')
export class PostController {
    constructor(private readonly postService: PostService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new post' })
    create(@Body() createPostDto: CreatePostDto) {
        // Automatically convert single string arrays if sent poorly from client formData (though standard POST json is fine)
        const tagsValue: any = createPostDto.tags;
        if (tagsValue && typeof tagsValue === 'string') {
            try {
                createPostDto.tags = JSON.parse(tagsValue);
            } catch {
                if (tagsValue !== '') createPostDto.tags = [(tagsValue as unknown) as number];
            }
        }
        return this.postService.create(createPostDto);
    }

    @Post('with-media')
    @UseInterceptors(FilesInterceptor('files', 10))
    @ApiOperation({ summary: 'Create a new post with multiple images' })
    createWithMedia(
        @Body() createPostDto: CreatePostDto,
        @UploadedFiles() files: Express.Multer.File[]
    ) {
        // Format parsing for formData keys
        if (createPostDto.user_id && typeof (createPostDto as any).user_id === 'string') createPostDto.user_id = Number(createPostDto.user_id);
        if (createPostDto.group_id && typeof (createPostDto as any).group_id === 'string') createPostDto.group_id = Number(createPostDto.group_id);
        
        const tagsValue: any = createPostDto.tags;
        if (tagsValue && typeof tagsValue === 'string') {
            try {
                createPostDto.tags = JSON.parse(tagsValue);
            } catch {
                if (tagsValue !== '') createPostDto.tags = [(tagsValue as unknown) as number];
            }
        }
        return this.postService.createWithMedia(createPostDto, files);
    }

    @Get()
    @ApiOperation({ summary: 'Get all posts' })
    findAll(@Query('userId') userId?: string) {
        return this.postService.findAll(userId ? Number(userId) : undefined);
    }
    
    @Get('group/:groupId')
    @ApiOperation({ summary: 'Get all posts for a group' })
    @ApiParam({ name: 'groupId', description: 'Group ID' })
    findByGroup(@Param('groupId', ParseIntPipe) groupId: number, @Query('userId') userId?: string) {
        return this.postService.findByGroupId(groupId, userId ? Number(userId) : undefined);
    }

    @Get('recommendations/:userId')
    @ApiOperation({ summary: 'Get recommended posts for a user' })
    @ApiParam({ name: 'userId', description: 'User ID' })
    getRecommendations(@Param('userId', ParseIntPipe) userId: number) {
        return this.postService.getRecommendations(userId);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a post by ID' })
    findOne(@Param('id', ParseIntPipe) id: number, @Query('userId') userId?: string) {
        return this.postService.findOne(id, userId ? Number(userId) : undefined);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update a post' })
    update(@Param('id', ParseIntPipe) id: number, @Body() updatePostDto: UpdatePostDto) {
        return this.postService.update(id, updatePostDto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a post' })
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.postService.remove(id);
    }

    // === COMMENTS ===

    @Post('comments')
    @ApiOperation({ summary: 'Create a new comment' })
    createComment(@Body() createCommentDto: CreateCommentDto) {
        return this.postService.createComment(createCommentDto);
    }

    @Get(':id/comments')
    @ApiOperation({ summary: 'Get all comments for a post' })
    findCommentsByPost(@Param('id', ParseIntPipe) id: number) {
        return this.postService.findCommentsByPost(id);
    }

    @Patch('comments/:commentId')
    @ApiOperation({ summary: 'Update a comment' })
    updateComment(
        @Param('commentId', ParseIntPipe) commentId: number,
        @Body() updateCommentDto: UpdateCommentDto
    ) {
        return this.postService.updateComment(commentId, updateCommentDto);
    }

    @Delete('comments/:commentId')
    @ApiOperation({ summary: 'Delete a comment' })
    removeComment(@Param('commentId', ParseIntPipe) commentId: number) {
        return this.postService.removeComment(commentId);
    }

    // === LIKES ===

    @Post(':id/like/:userId')
    @ApiOperation({ summary: 'Like a post' })
    @ApiParam({ name: 'id', description: 'Post ID' })
    @ApiParam({ name: 'userId', description: 'User ID' })
    likePost(
        @Param('id', ParseIntPipe) id: number,
        @Param('userId', ParseIntPipe) userId: number
    ) {
        return this.postService.likePost(userId, id);
    }

    @Delete(':id/like/:userId')
    @ApiOperation({ summary: 'Unlike a post' })
    unlikePost(
        @Param('id', ParseIntPipe) id: number,
        @Param('userId', ParseIntPipe) userId: number
    ) {
        return this.postService.unlikePost(userId, id);
    }

    // === SHARES ===

    @Post(':id/share/:userId')
    @ApiOperation({ summary: 'Share a post' })
    sharePost(
        @Param('id', ParseIntPipe) id: number,
        @Param('userId', ParseIntPipe) userId: number,
        @Body() bodyPayload?: { body: string }
    ) {
        return this.postService.sharePost(userId, id, bodyPayload?.body);
    }
}
