import {
    IsNotEmpty,
    IsString,
    IsEmail,
    MinLength,

} from 'class-validator';
import mongoose from 'mongoose';

export class CreateBlogPostDto {






    @IsNotEmpty({ message: 'Title is required.' })
    @IsString({ message: 'Title must be a string.' })
    title: string;

    // Reference to User (author)
    @IsNotEmpty({ message: 'Title is required.' })
    authorId: mongoose.Schema.Types.ObjectId;

    @IsNotEmpty({ message: 'Title is required.' })
    @IsString({ message: 'Password must be a string.' })
    richText: string;

    tags?: string[];
    
    comments?: mongoose.Types.ObjectId[];



}
