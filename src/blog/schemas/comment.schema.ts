
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';



export type CommentDocument = HydratedDocument<Comment>;

@Schema({ timestamps: true })
export class Comment {
  @Prop({ required: true })
  content: string;

  // Comment belongs to a User (who wrote it)
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  authorId: mongoose.Types.ObjectId;

  // Comment belongs to a BlogPost
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'BlogPost', required: true })
  postId: mongoose.Types.ObjectId;
}




export const CommentSchema = SchemaFactory.createForClass(Comment);
