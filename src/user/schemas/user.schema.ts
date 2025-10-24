import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';
import { UserRole } from '../userRolesEnum';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class ProductItem {
  // @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  // userId: Types.ObjectId;

  @Prop({ type: Number, default: 1, required: true })
  quantity: number;

  // @TODO add product variation indetification

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true })
  product: mongoose.Types.ObjectId;
}

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, trim: true })
  pfp: string;

  @Prop({ required: true, trim: true })
  email: string;

  @Prop({ trim: true })
  phone: string;
  @Prop({ trim: true })
  phone2: string;

  @Prop({ required: true, trim: true })
  password: string;

  @Prop({ trim: true })
  address: string;

  @Prop({ trim: true })
  division: string;

  @Prop({ trim: true })
  city: string;

  @Prop({ trim: true })
  deliver_instructions: string;



  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }],
    default: [],
  })
  orders: mongoose.Types.ObjectId[];
  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Payment' }],
    default: [],
  })
  payments: mongoose.Types.ObjectId[];

  @Prop({ type: [ProductItem], default: [] })
  cart: ProductItem[];
  @Prop({ type: [ProductItem], default: [] })
  wishlist: ProductItem[];

  @Prop({ required: true, enum: UserRole, default: UserRole.VIEWER })
  role: UserRole;
}

export const UserSchema = SchemaFactory.createForClass(User);
