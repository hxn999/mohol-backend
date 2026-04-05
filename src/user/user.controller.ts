import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
  ParseIntPipe,
  UploadedFile,
  UseInterceptors,
  NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserService } from './user.service';
import { FindQueryDto } from './dto/findQueryDto';
import { UpdateUserDto } from './dto/updateUserDto';
import { AuthGuard } from 'src/auth/auth.guard';
import { RequestWithAuth } from 'src/auth/auth.controller';
import { CreateUserDto } from './dto/createUserDto';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserResponseDto } from './dto/userResponseDto';
import { ApiErrorDto } from './dto/apiErrorDto';
import { RelationshipService } from 'src/relationship/relationship.service';

@ApiTags('user')
@Controller('user')
export class UserController {
  constructor(
    private userService: UserService,
    private relationshipService: RelationshipService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: 'User created successfully', type: UserResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request', type: ApiErrorDto })
  @ApiResponse({ status: 409, description: 'Conflict (duplicate email/username)', type: ApiErrorDto })
  async create(@Body() dto: CreateUserDto) {
    return this.userService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Find all users with optional filtering' })
  @ApiResponse({ status: 200, description: 'List of users', type: [UserResponseDto] })
  async findAll(@Query() query: FindQueryDto, @Query('requesterId') requesterId?: string) {
    let blockedIds: number[] = [];
    if (requesterId) {
      blockedIds = await this.relationshipService.getBlockedUserIds(Number(requesterId));
    }
    return this.userService.findAll(query, blockedIds);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID, email, or username' })
  @ApiParam({ name: 'id', description: 'User ID (Integer), Email, or Username', example: '1' })
  @ApiResponse({ status: 200, description: 'User found', type: UserResponseDto })
  @ApiResponse({ status: 404, description: 'User not found', type: ApiErrorDto })
  async findOne(@Param('id') id: string, @Query('requesterId') requesterId?: string) {
    if (requesterId) {
      const targetUser = await this.userService.findOne(id);
      const blocked = await this.relationshipService.isBlocked(Number(requesterId), targetUser.id);
      if (blocked) {
        throw new NotFoundException('This profile is not available.');
      }
      return targetUser;
    }
    return this.userService.findOne(id);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard)
  @Patch()
  @ApiOperation({ summary: 'Update current user information' })
  @ApiResponse({ status: 200, description: 'User updated successfully', type: UserResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized', type: ApiErrorDto })
  @ApiResponse({ status: 404, description: 'User not found', type: ApiErrorDto })
  async update(@Req() req: RequestWithAuth, @Body() dto: UpdateUserDto) {
    return this.userService.updateOne(req.user.id, dto);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete user by ID' })
  @ApiParam({ name: 'id', description: 'User ID (Integer)', example: '1' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized', type: ApiErrorDto })
  @ApiResponse({ status: 404, description: 'User not found', type: ApiErrorDto })
  async delete(@Param('id', ParseIntPipe) id: number) {
    return this.userService.deleteOne(id);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard)
  @Post('profile-picture')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload / replace profile picture' })
  @ApiResponse({ status: 200, description: 'Profile picture updated', type: UserResponseDto })
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 8 * 1024 * 1024 } }))
  async uploadProfilePicture(
    @Req() req: RequestWithAuth,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.userService.uploadProfilePicture(Number(req.user.id), file);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard)
  @Post('cover-picture')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload / replace cover picture' })
  @ApiResponse({ status: 200, description: 'Cover picture updated', type: UserResponseDto })
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 8 * 1024 * 1024 } }))
  async uploadCoverPicture(
    @Req() req: RequestWithAuth,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.userService.uploadCoverPicture(Number(req.user.id), file);
  }
}
