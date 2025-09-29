
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { UserRole } from '../userRolesEnum';

export type UserDocument = HydratedDocument<User>;

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

  @Prop({ required: true })
  password: string;

  @Prop({ trim: true })
  institute: string;

  @Prop({ required: true, enum: UserRole, default: UserRole.VIEWER })
  role: UserRole;
  
}



export const UserSchema = SchemaFactory.createForClass(User);
