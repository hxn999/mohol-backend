import { IsUUID, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { MembershipRole } from 'src/database/database.types';
import { ApiProperty } from '@nestjs/swagger';

export class AddMemberDto {
    @ApiProperty()
    @IsUUID()
    @IsNotEmpty()
    user_id: string;

    @ApiProperty({ enum: ['member', 'admin', 'moderator', 'owner'], default: 'member' })
    @IsEnum(['member', 'admin', 'moderator', 'owner'])
    @IsOptional()
    role?: MembershipRole;
}
