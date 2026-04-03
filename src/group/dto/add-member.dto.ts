import { IsInt, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { MembershipRole } from 'src/database/database.types';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class AddMemberDto {
    @ApiProperty()
    @IsInt()
    @Type(() => Number)
    @IsNotEmpty()
    user_id: number;

    @ApiProperty({ enum: ['member', 'admin', 'moderator', 'owner'], default: 'member' })
    @IsEnum(['member', 'admin', 'moderator', 'owner'])
    @IsOptional()
    role?: MembershipRole;
}
