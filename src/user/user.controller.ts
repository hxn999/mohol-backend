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
} from '@nestjs/common';
import { UserService } from './user.service';
import { FindQueryDto } from './dto/findQueryDto';
import { UpdateUserDto } from './dto/updateUserDto';
import { AuthGuard } from 'src/auth/auth.guard';
import { RequestWithAuth } from 'src/auth/auth.controller';
import { CreateUserDto } from './dto/createUserDto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserResponseDto } from './dto/userResponseDto';
import { ApiErrorDto } from './dto/apiErrorDto';

@ApiTags('user')
@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

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
  async findAll(@Query() query: FindQueryDto) {
    return this.userService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID, email, or username' })
  @ApiParam({ name: 'id', description: 'User ID (Integer), Email, or Username', example: '1' })
  @ApiResponse({ status: 200, description: 'User found', type: UserResponseDto })
  @ApiResponse({ status: 404, description: 'User not found', type: ApiErrorDto })
  async findOne(@Param('id') id: string) {
    // We pass it as string to service because findOne handles both ID (number) and email/username (string)
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
  async delete(@Param('id') id: number) {
    return this.userService.deleteOne(id);
  }
}
