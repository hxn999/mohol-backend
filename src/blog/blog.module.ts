import { Module } from '@nestjs/common';
import { BlogController } from './blog.controller';
import { BlogService } from './blog.service';
import { MongooseModule } from '@nestjs/mongoose';
import { BlogPost, BlogPostSchema } from './schemas/blogPost.schema';
import { CommentSchema } from './schemas/comment.schema';

@Module({
  controllers: [BlogController],
  providers: [BlogService],
   imports: [
    MongooseModule.forFeature([
      { name: BlogPost.name, schema: BlogPostSchema },
      { name: Comment.name, schema: CommentSchema },
    ]),
  ],
})
export class BlogModule {}
