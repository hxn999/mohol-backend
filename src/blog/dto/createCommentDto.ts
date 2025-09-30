import {
    IsNotEmpty,
    IsString,
    IsEmail,
    MinLength,

} from 'class-validator';
import mongoose from 'mongoose';

export class CreateCommentDto {


   



    @IsNotEmpty({ message: 'Content is required.' })
    @IsString({ message: 'Content must be a string.' })
    content: string;

    // Reference to User (author)
    @IsNotEmpty({ message: 'AuthorId is required.' })
    authorId: mongoose.Schema.Types.ObjectId;

    @IsNotEmpty({ message: 'PostId is required.' })
    postId: mongoose.Schema.Types.ObjectId;


}
