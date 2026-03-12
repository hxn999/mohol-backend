import { IsString, IsNotEmpty, IsOptional, IsEnum, IsUUID } from 'class-validator';
import { GroupVisibility } from 'src/database/database.types';
import { ApiProperty } from '@nestjs/swagger';

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
    @IsUUID()
    @IsOptional()
    cover_img_id?: string;

    @ApiProperty({ enum: ['public', 'private', 'hidden'], default: 'public' })
    @IsEnum(['public', 'private', 'hidden'])
    @IsOptional()
    visibility?: GroupVisibility;
}
