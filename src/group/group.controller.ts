import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, Query } from '@nestjs/common';
import { GroupService } from './group.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('groups')
@Controller('groups')
export class GroupController {
    constructor(private readonly groupService: GroupService) { }
    
    @Get('user/:userId')
    @ApiOperation({ summary: 'Get all groups a user is a member of' })
    findUserGroups(@Param('userId', ParseIntPipe) userId: number) {
        return this.groupService.findUserGroups(userId);
    }

    @Get('suggested/:userId')
    @ApiOperation({ summary: 'Get suggested groups for a user' })
    getSuggestedGroups(@Param('userId', ParseIntPipe) userId: number) {
        return this.groupService.getSuggestedGroups(userId);
    }

    @Post()
    @ApiOperation({ summary: 'Create a new group' })
    create(@Body() createGroupDto: CreateGroupDto & { creator_id: number }) {
        return this.groupService.create(createGroupDto);
    }

    @Get()
    @ApiOperation({ summary: 'Get all groups' })
    findAll() {
        return this.groupService.findAll();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a group by ID' })
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.groupService.findOne(id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update a group' })
    update(@Param('id', ParseIntPipe) id: number, @Body() updateGroupDto: UpdateGroupDto) {
        return this.groupService.update(id, updateGroupDto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a group' })
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.groupService.remove(id);
    }

    // === MEMBERSHIP ===

    @Post(':id/members')
    @ApiOperation({ summary: 'Add a member to a group' })
    addMember(@Param('id', ParseIntPipe) id: number, @Body() addMemberDto: AddMemberDto) {
        return this.groupService.addMember(id, addMemberDto);
    }

    @Post(':id/invite')
    @ApiOperation({ summary: 'Invite a member to a group' })
    inviteMember(
        @Param('id', ParseIntPipe) id: number,
        @Body() body: { targetUserId: number; requesterUserId: number }
    ) {
        return this.groupService.inviteMember(id, body.targetUserId, body.requesterUserId);
    }

    @Patch(':id/members/:userId/role')
    @ApiOperation({ summary: 'Update a member role' })
    updateMemberRole(
        @Param('id', ParseIntPipe) id: number,
        @Param('userId', ParseIntPipe) userId: number,
        @Body() body: { role: string; requesterUserId: number }
    ) {
        return this.groupService.updateMemberRole(id, userId, body.requesterUserId, body.role);
    }

    @Delete(':id/members/:userId')
    @ApiOperation({ summary: 'Remove a member from a group' })
    removeMember(
        @Param('id', ParseIntPipe) id: number,
        @Param('userId', ParseIntPipe) userId: number,
        @Query('requesterUserId', ParseIntPipe) requesterUserId: number
    ) {
        return this.groupService.removeMember(id, userId, requesterUserId);
    }

    @Get(':id/members')
    @ApiOperation({ summary: 'Get all members of a group' })
    findMembers(@Param('id', ParseIntPipe) id: number) {
        return this.groupService.findMembers(id);
    }
}
