import { IsString, IsNotEmpty, IsOptional, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateCommentDto {
    @ApiProperty()
    @IsInt()
    @Type(() => Number)
    @IsNotEmpty()
    post_id: number;

    @ApiProperty()
    @IsInt()
    @Type(() => Number)
    @IsNotEmpty()
    user_id: number;

    @ApiProperty({ required: false })
    @IsInt()
    @Type(() => Number)
    @IsOptional()
    parent_id?: number;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    comment: string;
}
