import { IsString, IsOptional, IsEnum, IsInt } from 'class-validator';
import { GroupVisibility } from 'src/database/database.types';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class UpdateGroupDto {
    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    title?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty({ required: false })
    @IsInt()
    @Type(() => Number)
    @IsOptional()
    cover_img_id?: number;

    @ApiProperty({ enum: ['public', 'private', 'hidden'], required: false })
    @IsEnum(['public', 'private', 'hidden'])
    @IsOptional()
    visibility?: GroupVisibility;
}
