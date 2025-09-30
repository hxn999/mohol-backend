import {
    IsNotEmpty,
    IsString,
    IsOptional,
    IsArray,
    IsUrl
} from 'class-validator';

export class CreateBookDto {

    @IsNotEmpty({ message: 'Title is required.' })
    @IsString({ message: 'Title must be a string.' })
    title: string;

    @IsNotEmpty({ message: 'File URL is required.' })
    @IsString({ message: 'File URL must be a string.' })
    fileUrl: string;

    @IsOptional()
    @IsString({ message: 'Description must be a string.' })
    description?: string;

    @IsNotEmpty({ message: 'Rich text content is required.' })
    @IsString({ message: 'Rich text must be a string.' })
    richText: string;

    @IsOptional()
    @IsArray({ message: 'Tags must be an array.' })
    @IsString({ each: true, message: 'Each tag must be a string.' })
    tags?: string[];

}
