import { BadRequestException, ConflictException, HttpException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { User } from './schemas/user.schema';
import { DeleteResult, Model, UpdateWriteOpResult } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { CreateUserDto } from './dto/createUserDto';



@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) { }
  private readonly logger = new Logger(UserService.name);


  async create(user: CreateUserDto): Promise<User> {
    try {
      // checks for duplicate accounts
      const foundUser = await this.userModel.findOne({email:user.email}).exec();
      if(!foundUser)
      {
        throw new ConflictException("User account already exists !")
      }

      const createdUser = new this.userModel(user);
      return await createdUser.save();
    } catch (error) {

      throw new BadRequestException(error.message);
    }
  }

  async findOne(query: string): Promise<User> {
    try {
      // matches with email or mongo id
      const user = await this.userModel.findOne({$or:[{email:query},{_id:query}]}).exec();
      if (!user) {
        throw new NotFoundException(`User with id ${query} not found`);
      }
      return user;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

   async findMany(query: string): Promise<User[]> {
    try {
      // matches with email or mongo id
      const users = await this.userModel.find({$or:[{email:query},{_id:query}]}).exec();
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
      const deletedUserResult = await this.userModel.deleteOne({$or:[{email:query},{_id:query}]}).exec();
      if (!deletedUserResult) {
        throw new NotFoundException(`User with id ${query} not found`);
      }
      return deletedUserResult;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async deleteMany(query: string): Promise<DeleteResult> {
    try {
      // matches with email or mongo id
      const deletedUserResult = await this.userModel.deleteMany({$or:[{email:query},{_id:query}]}).exec();
     
      return deletedUserResult;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
async updateOne(query: string,updatedUser): Promise<UpdateWriteOpResult> {
    try {
      // matches with email or mongo id
      const updatedUserResult = await this.userModel.updateOne({$or:[{email:query},{_id:query}]},{$set:updatedUser}).exec();
      
      return updatedUserResult;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }





}
