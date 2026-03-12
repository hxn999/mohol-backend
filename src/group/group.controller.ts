import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe } from '@nestjs/common';
import { GroupService } from './group.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('groups')
@Controller('groups')
export class GroupController {
    constructor(private readonly groupService: GroupService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new group' })
    create(@Body() createGroupDto: CreateGroupDto) {
        return this.groupService.create(createGroupDto);
    }

    @Get()
    @ApiOperation({ summary: 'Get all groups' })
    findAll() {
        return this.groupService.findAll();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a group by ID' })
    findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.groupService.findOne(id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update a group' })
    update(@Param('id', ParseUUIDPipe) id: string, @Body() updateGroupDto: UpdateGroupDto) {
        return this.groupService.update(id, updateGroupDto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a group' })
    remove(@Param('id', ParseUUIDPipe) id: string) {
        return this.groupService.remove(id);
    }

    // === MEMBERSHIP ===

    @Post(':id/members')
    @ApiOperation({ summary: 'Add a member to a group' })
    addMember(@Param('id', ParseUUIDPipe) id: string, @Body() addMemberDto: AddMemberDto) {
        return this.groupService.addMember(id, addMemberDto);
    }

    @Delete(':id/members/:userId')
    @ApiOperation({ summary: 'Remove a member from a group' })
    removeMember(
        @Param('id', ParseUUIDPipe) id: string,
        @Param('userId', ParseUUIDPipe) userId: string
    ) {
        return this.groupService.removeMember(id, userId);
    }

    @Get(':id/members')
    @ApiOperation({ summary: 'Get all members of a group' })
    findMembers(@Param('id', ParseUUIDPipe) id: string) {
        return this.groupService.findMembers(id);
    }
}
