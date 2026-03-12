import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCommentDto {
    @ApiProperty()
    @IsUUID()
    @IsNotEmpty()
    post_id: string;

    @ApiProperty()
    @IsUUID()
    @IsNotEmpty()
    user_id: string;

    @ApiProperty({ required: false })
    @IsUUID()
    @IsOptional()
    parent_id?: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    comment: string;
}
