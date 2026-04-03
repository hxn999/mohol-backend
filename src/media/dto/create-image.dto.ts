import { IsString, IsNotEmpty, IsOptional, IsInt, IsEnum } from 'class-validator';
import { ImageType } from 'src/database/database.types';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateImageDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    url: string;

    @ApiProperty({ required: false })
    @IsInt()
    @Type(() => Number)
    @IsOptional()
    post_id?: number;

    @ApiProperty({ required: false })
    @IsInt()
    @Type(() => Number)
    @IsOptional()
    user_id?: number;

    @ApiProperty({ enum: ['profile', 'cover', 'post', 'comment', 'group_cover'] })
    @IsEnum(['profile', 'cover', 'post', 'comment', 'group_cover'])
    @IsNotEmpty()
    type: ImageType;
}
