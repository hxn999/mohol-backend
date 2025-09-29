
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import  { HydratedDocument } from 'mongoose';



export type BookDocument = HydratedDocument<Book>;

@Schema({ timestamps: true })

export class Book {

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true, trim: true })
  fileUrl: string;

  @Prop({  trim: true })
  description: string;
    
  @Prop({ required: true, trim: true })
  richText: string;

  @Prop({ default:[] })
  tags: string[];

}



export const BookSchema = SchemaFactory.createForClass(Book);
