import { Controller, Post, Delete, Patch, Param, ParseUUIDPipe, Body } from '@nestjs/common';
import { RelationshipService } from './relationship.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('relationships')
@Controller('relationships')
export class RelationshipController {
    constructor(private readonly relationshipService: RelationshipService) { }

    // === BLOCK ===

    @Post('block/:blockerId/:blockedId')
    @ApiOperation({ summary: 'Block a user' })
    blockUser(
        @Param('blockerId', ParseUUIDPipe) blockerId: string,
        @Param('blockedId', ParseUUIDPipe) blockedId: string
    ) {
        return this.relationshipService.blockUser(blockerId, blockedId);
    }

    @Delete('block/:blockerId/:blockedId')
    @ApiOperation({ summary: 'Unblock a user' })
    unblockUser(
        @Param('blockerId', ParseUUIDPipe) blockerId: string,
        @Param('blockedId', ParseUUIDPipe) blockedId: string
    ) {
        return this.relationshipService.unblockUser(blockerId, blockedId);
    }

    // === FOLLOW ===

    @Post('follow/:followerId/:followingId')
    @ApiOperation({ summary: 'Follow a user' })
    followUser(
        @Param('followerId', ParseUUIDPipe) followerId: string,
        @Param('followingId', ParseUUIDPipe) followingId: string
    ) {
        return this.relationshipService.followUser(followerId, followingId);
    }

    @Delete('follow/:followerId/:followingId')
    @ApiOperation({ summary: 'Unfollow a user' })
    unfollowUser(
        @Param('followerId', ParseUUIDPipe) followerId: string,
        @Param('followingId', ParseUUIDPipe) followingId: string
    ) {
        return this.relationshipService.unfollowUser(followerId, followingId);
    }

    // === FRIENDS ===

    @Post('friends/:userId/:friendId')
    @ApiOperation({ summary: 'Send friend request' })
    sendFriendRequest(
        @Param('userId', ParseUUIDPipe) userId: string,
        @Param('friendId', ParseUUIDPipe) friendId: string
    ) {
        return this.relationshipService.sendFriendRequest(userId, friendId);
    }

    @Patch('friends/:userId/:friendId/status')
    @ApiOperation({ summary: 'Update friend request status' })
    updateFriendStatus(
        @Param('userId', ParseUUIDPipe) userId: string,
        @Param('friendId', ParseUUIDPipe) friendId: string,
        @Body('status') status: 'accepted' | 'rejected'
    ) {
        return this.relationshipService.updateFriendStatus(userId, friendId, status);
    }

    @Delete('friends/:userId/:friendId')
    @ApiOperation({ summary: 'Remove friend / Cancel request' })
    removeFriend(
        @Param('userId', ParseUUIDPipe) userId: string,
        @Param('friendId', ParseUUIDPipe) friendId: string
    ) {
        return this.relationshipService.removeFriend(userId, friendId);
    }
}
