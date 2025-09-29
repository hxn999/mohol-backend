
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { User } from 'src/user/schemas/user.schema';


export type BlogPostDocument = HydratedDocument<BlogPost>;

@Schema({ timestamps: true })
export class BlogPost {

  @Prop({ required: true, trim: true })
  title: string;

   // Reference to User (author)
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  author: User;

  @Prop({ required: true, trim: true })
  richText: string;

  @Prop({ default:[] })
  tags: string[];

   // A blog post can have many comments
  @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }] })
  comments: mongoose.Types.ObjectId[];

  
  
}



export const BlogPostSchema = SchemaFactory.createForClass(BlogPost);
