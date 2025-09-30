import { BadRequestException, ConflictException, HttpException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { User, UserDocument } from './schemas/user.schema';
import { DeleteResult, Model, UpdateWriteOpResult } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { CreateUserDto } from './dto/createUserDto';
import * as bcrypt from 'bcrypt'
import { Types } from 'mongoose';


@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) { }
  private readonly logger = new Logger(UserService.name);


  async create(user: CreateUserDto): Promise<UserDocument> {
    try {
      // checks for duplicate accounts
      const foundUser = await this.userModel.findOne({ email: user.email }).exec();
      if (foundUser) {
        throw new ConflictException("User account already exists !")
      }

      // hashing user's password for security
      const saltOrRounds = 10;
      const hashedPassword = await bcrypt.hash(user.password, saltOrRounds);
      user.password = hashedPassword

      const createdUser = new this.userModel(user);
      return await createdUser.save();
    } catch (error) {

      throw new BadRequestException(error.message);
    }
  }

  async findOne(query: string): Promise<UserDocument> {
    try {
      // matches with email or mongo id
      

      let user;
      if (Types.ObjectId.isValid(query)) {
        user = await this.userModel.findOne({ _id:  new Types.ObjectId(query) }).exec();
      }
      else{
        user = await this.userModel.findOne({ email:  query }).exec();
      }

      
      if (!user) {
        throw new NotFoundException(`User with id ${query} not found`);
      }
      return user;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async findMany(query: Object): Promise<UserDocument[]> {
    try {
      // matches with email or mongo id
     
      let users = await this.userModel.find(query).exec();
     
      if (!users) {
        throw new NotFoundException(`User with id ${query} not found`);
      }
      return users;
      
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }



  async deleteOne(query: string): Promise<DeleteResult> {
    try {
      // matches with email or mongo id
      let deletedUserResult;
      if (Types.ObjectId.isValid(query)) {
        deletedUserResult = await this.userModel.deleteOne({ _id:  new Types.ObjectId(query) }).exec();
      }
      else{
        deletedUserResult = await this.userModel.deleteOne({ email:  query }).exec();
      }

      if (!deletedUserResult) {
        throw new NotFoundException(`User with id ${query} not found`);
      }
      return deletedUserResult;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // async deleteMany(query: string): Promise<DeleteResult> {
  //   try {
  //     // matches with email or mongo id
  //     let deletedUserResult;
  //     if (Types.ObjectId.isValid(query)) {
  //       deletedUserResult = await this.userModel.deleteMany({ _id:  new Types.ObjectId(query) }).exec();
  //     }
  //     else{
  //       deletedUserResult = await this.userModel.deleteMany({ email:  query }).exec();
  //     }
  //     return deletedUserResult;
  //   } catch (error) {
  //     throw new BadRequestException(error.message);
  //   }
  // }
  async updateOne(query: string, updatedUser): Promise<UpdateWriteOpResult> {
    try {
      // matches with email or mongo id
     let updatedUserResult;
      if (Types.ObjectId.isValid(query)) {
        updatedUserResult = await this.userModel.updateOne({ _id:  new Types.ObjectId(query) },{$set:updatedUser}).exec();
      }
      else{
        updatedUserResult = await this.userModel.updateOne({ email:  query },{$set:updatedUser}).exec();
      }
      return updatedUserResult;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }





}
