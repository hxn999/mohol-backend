import { Controller, Post, Delete, Patch, Param, ParseIntPipe, Body, Get } from '@nestjs/common';
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
        @Param('blockerId', ParseIntPipe) blockerId: number,
        @Param('blockedId', ParseIntPipe) blockedId: number
    ) {
        return this.relationshipService.blockUser(blockerId, blockedId);
    }

    @Delete('block/:blockerId/:blockedId')
    @ApiOperation({ summary: 'Unblock a user' })
    unblockUser(
        @Param('blockerId', ParseIntPipe) blockerId: number,
        @Param('blockedId', ParseIntPipe) blockedId: number
    ) {
        return this.relationshipService.unblockUser(blockerId, blockedId);
    }

    // === FOLLOW ===

    @Post('follow/:followerId/:followingId')
    @ApiOperation({ summary: 'Follow a user' })
    followUser(
        @Param('followerId', ParseIntPipe) followerId: number,
        @Param('followingId', ParseIntPipe) followingId: number
    ) {
        return this.relationshipService.followUser(followerId, followingId);
    }

    @Delete('follow/:followerId/:followingId')
    @ApiOperation({ summary: 'Unfollow a user' })
    unfollowUser(
        @Param('followerId', ParseIntPipe) followerId: number,
        @Param('followingId', ParseIntPipe) followingId: number
    ) {
        return this.relationshipService.unfollowUser(followerId, followingId);
    }

    // === FRIENDS ===

    @Post('friends/:userId/:friendId')
    @ApiOperation({ summary: 'Send friend request' })
    sendFriendRequest(
        @Param('userId', ParseIntPipe) userId: number,
        @Param('friendId', ParseIntPipe) friendId: number
    ) {
        return this.relationshipService.sendFriendRequest(userId, friendId);
    }

    @Patch('friends/:userId/:friendId/status')
    @ApiOperation({ summary: 'Update friend request status' })
    updateFriendStatus(
        @Param('userId', ParseIntPipe) userId: number,
        @Param('friendId', ParseIntPipe) friendId: number,
        @Body('status') status: 'accepted' | 'rejected'
    ) {
        return this.relationshipService.updateFriendStatus(userId, friendId, status);
    }

    @Delete('friends/:userId/:friendId')
    @ApiOperation({ summary: 'Remove friend / Cancel request' })
    removeFriend(
        @Param('userId', ParseIntPipe) userId: number,
        @Param('friendId', ParseIntPipe) friendId: number
    ) {
        return this.relationshipService.removeFriend(userId, friendId);
    }

    @Get('friends/:userId')
    @ApiOperation({ summary: 'Get all friends of a user' })
    getFriends(@Param('userId', ParseIntPipe) userId: number) {
        return this.relationshipService.getFriends(userId);
    }

    @Get('friends/:userId/pending')
    @ApiOperation({ summary: 'Get pending friend requests for a user' })
    getPendingRequests(@Param('userId', ParseIntPipe) userId: number) {
        return this.relationshipService.getPendingRequests(userId);
    }

    @Get('status/:user1Id/:user2Id')
    @ApiOperation({ summary: 'Get relationship status between two users' })
    getStatus(
        @Param('user1Id', ParseIntPipe) user1Id: number,
        @Param('user2Id', ParseIntPipe) user2Id: number
    ) {
        return this.relationshipService.getStatus(user1Id, user2Id);
    }
}
