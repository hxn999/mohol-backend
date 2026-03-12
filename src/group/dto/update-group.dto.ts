import { IsString, IsOptional, IsEnum, IsUUID } from 'class-validator';
import { GroupVisibility } from 'src/database/database.types';
import { ApiProperty } from '@nestjs/swagger';

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
    @IsUUID()
    @IsOptional()
    cover_img_id?: string;

    @ApiProperty({ enum: ['public', 'private', 'hidden'], required: false })
    @IsEnum(['public', 'private', 'hidden'])
    @IsOptional()
    visibility?: GroupVisibility;
}
