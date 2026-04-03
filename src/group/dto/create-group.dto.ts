import { IsString, IsNotEmpty, IsOptional, IsEnum, IsInt } from 'class-validator';
import { GroupVisibility } from 'src/database/database.types';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateGroupDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    title: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty({ required: false })
    @IsInt()
    @Type(() => Number)
    @IsOptional()
    cover_img_id?: number;

    @ApiProperty({ enum: ['public', 'private', 'hidden'], default: 'public' })
    @IsEnum(['public', 'private', 'hidden'])
    @IsOptional()
    visibility?: GroupVisibility;
}
