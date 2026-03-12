import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe } from '@nestjs/common';
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
        return this.postService.create(createPostDto);
    }

    @Get()
    @ApiOperation({ summary: 'Get all posts' })
    findAll() {
        return this.postService.findAll();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a post by ID' })
    findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.postService.findOne(id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update a post' })
    update(@Param('id', ParseUUIDPipe) id: string, @Body() updatePostDto: UpdatePostDto) {
        return this.postService.update(id, updatePostDto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a post' })
    remove(@Param('id', ParseUUIDPipe) id: string) {
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
    findCommentsByPost(@Param('id', ParseUUIDPipe) id: string) {
        return this.postService.findCommentsByPost(id);
    }

    @Patch('comments/:commentId')
    @ApiOperation({ summary: 'Update a comment' })
    updateComment(
        @Param('commentId', ParseUUIDPipe) commentId: string,
        @Body() updateCommentDto: UpdateCommentDto
    ) {
        return this.postService.updateComment(commentId, updateCommentDto);
    }

    @Delete('comments/:commentId')
    @ApiOperation({ summary: 'Delete a comment' })
    removeComment(@Param('commentId', ParseUUIDPipe) commentId: string) {
        return this.postService.removeComment(commentId);
    }

    // === LIKES ===

    @Post(':id/like/:userId')
    @ApiOperation({ summary: 'Like a post' })
    @ApiParam({ name: 'id', description: 'Post ID' })
    @ApiParam({ name: 'userId', description: 'User ID' })
    likePost(
        @Param('id', ParseUUIDPipe) id: string,
        @Param('userId', ParseUUIDPipe) userId: string
    ) {
        return this.postService.likePost(userId, id);
    }

    @Delete(':id/like/:userId')
    @ApiOperation({ summary: 'Unlike a post' })
    unlikePost(
        @Param('id', ParseUUIDPipe) id: string,
        @Param('userId', ParseUUIDPipe) userId: string
    ) {
        return this.postService.unlikePost(userId, id);
    }

    // === SHARES ===

    @Post(':id/share/:userId')
    @ApiOperation({ summary: 'Share a post' })
    sharePost(
        @Param('id', ParseUUIDPipe) id: string,
        @Param('userId', ParseUUIDPipe) userId: string
    ) {
        return this.postService.sharePost(userId, id);
    }
}
