import { IsString, IsNotEmpty, IsOptional, IsUUID, IsEnum } from 'class-validator';
import { ImageType } from 'src/database/database.types';
import { ApiProperty } from '@nestjs/swagger';

export class CreateImageDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    url: string;

    @ApiProperty({ required: false })
    @IsUUID()
    @IsOptional()
    post_id?: string;

    @ApiProperty({ required: false })
    @IsUUID()
    @IsOptional()
    user_id?: string;

    @ApiProperty({ enum: ['profile', 'cover', 'post', 'comment', 'group_cover'] })
    @IsEnum(['profile', 'cover', 'post', 'comment', 'group_cover'])
    @IsNotEmpty()
    type: ImageType;
}
