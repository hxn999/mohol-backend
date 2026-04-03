import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { Request, Response } from 'express';
import { SigninDto } from './dto/signinDto';
import { CreateUserDto } from 'src/user/dto/createUserDto';
import { PassresetDto } from './dto/passResetDto';
import { PasswordChangeDto } from './dto/passwordChangeDto';
import { AbilityTuple, MongoAbility, MongoQuery } from '@casl/ability';
import { Action } from 'src/casl/actionEnum';
import { AuthGuard } from './auth.guard';
import { AbilitiesGuard } from 'src/casl/abilities.guard';

export type RequestWithAuth = Request & { user: { id: string; role: string } } & {
  ability: MongoAbility<AbilityTuple, MongoQuery>;
};

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Login with email or username' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 400, description: 'Invalid credentials or missing identifier' })
  async login(@Res() res: Response, @Body() credentials: SigninDto) {
    const identifier = credentials.email;
    
    return this.authService.login(identifier, credentials.password, res);
  }



  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 409, description: 'Email or username already exists' })
  async register(@Res() res: Response, @Body() createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto, res);
  }



  @Delete('logout')
  @ApiOperation({ summary: 'Logout user and clear cookies' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  async logOut(@Req() req: Request, @Res() res: Response) {
    return this.authService.logout(req, res);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token using refresh token cookie' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid or missing refresh token' })
  async refreshAccessToken(@Req() req: Request, @Res() res: Response) {
    return this.authService.refreshAccessToken(req, res);
  }

  @UseGuards(AuthGuard, AbilitiesGuard)
  @Post('password-change')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Change user password' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 406, description: 'Wrong current password' })
  async passwordChange(
    @Req() req: RequestWithAuth,
    @Res() res: Response,
    @Body() passchangeDto: PasswordChangeDto,
  ) {
    if (!req.user || !req.user.id) {
      throw new BadRequestException('User ID is missing from request');
    }

    return this.authService.changePassword(
      req,
      passchangeDto.prevPassword,
      passchangeDto.newPassword,
      res,
    );
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Request password reset link' })
  @ApiResponse({ status: 200, description: 'Reset link sent if user exists' })
  async forgotPassword(@Body() body: { identifier: string }) {
    return this.authService.forgotPassword(body.identifier);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password using token' })
  @ApiResponse({ status: 200, description: 'Password reset successful' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  async passwordReset(
    @Query('token') token: string,
    @Body() passResetDto: PassresetDto,
  ) {
    return this.authService.resetPassword(token, passResetDto.password);
  }

  @UseGuards(AuthGuard)
  @Get('me')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get current authenticated user information' })
  @ApiResponse({ status: 200, description: 'User information retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getCurrentUser(@Req() req: RequestWithAuth) {
    if (!req.user || !req.user.id) {
      throw new BadRequestException('User ID is missing from request');
    }

    const user = await this.authService.getCurrentUser(req.user.id);
    return user;
  }
}
