import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ProductDocument = HydratedDocument<Product>;

// Comment interface for product comments
export class Comment {
  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({ required: true, trim: true, maxlength: 1000 })
  comment: string;

  @Prop({ default: Date.now })
  timestamp: Date;
}

// Option interface for product options (e.g., size, variant)
export class Variant {
  @Prop({ required: true, trim: true })
  type: string; // e.g., 'Size', 'Variant', 'Color'

  @Prop({ required: true, min: 0 })
  price: number;
}

@Schema({ timestamps: true })
export class Product {
  @Prop({ required: true, trim: true, maxlength: 200 })
  title: string;

  @Prop({ required: true, trim: true, maxlength: 2000 })
  description: string;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ type: [String], default: [] })
  category: string[];

  @Prop({ type: [Comment], default: [] })
  comments: Comment[];

  @Prop({ type: [Variant], default: [] })
  options: Variant[];

  //stores the minimum price
  @Prop({ required: true, min: 0 })
  price: number;

  @Prop({ required: true, min: 0 })
  lastingTime: number; // in hours

  @Prop({ required: true, trim: true, maxlength: 100 })
  smellProjection: string; // e.g., 'Close to skin', 'Moderate', 'Strong'

  @Prop({ required: true, unique: true, trim: true, uppercase: true })
  sku: string; // Stock Keeping Unit

  @Prop({ required: true, min: 0, default: 0 })
  stock: number;
}

export const ProductSchema = SchemaFactory.createForClass(Product);

// Create indexes for better query performance
ProductSchema.index({ title: 'text', description: 'text' }); // Text search
ProductSchema.index({ tags: 1 });
ProductSchema.index({ category: 1 });
ProductSchema.index({ sku: 1 });
ProductSchema.index({ stock: 1 });
