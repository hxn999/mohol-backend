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
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Request, Response } from 'express';
import { SigninDto } from './dto/signinDto';
import { CreateUserDto } from 'src/user/dto/createUserDto';
import { PassresetDto } from './dto/passResetDto';
import { PasswordChangeDto } from './dto/passwordChangeDto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Res() res: Response, @Body() body: SigninDto) {
    return this.authService.login(body.email, body.password, res);
  }

  @Post('login-google')
  async loginByGoogle(@Res() res: Response, @Query('code') code: string) {
    return this.authService.loginByGoogle(res, code);
  }

  @Post('register')
  async register(@Res() res: Response, @Body() createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto, res);
  }

  @Post('register-google')
  async registerByGoogle(@Res() res: Response, @Query('code') code: string) {
    return this.authService.registerByGoogle(res, code);
  }

  @Delete('logout')
  async logOut(@Req() req: Request, @Res() res: Response) {
    return this.authService.logout(req, res);
  }

  @Post('refresh')
  async refreshAccessToken(@Req() req: Request, @Res() res: Response){
    return this.authService.refreshAccessToken(req,res)
  }

  @Post('password-change')
  async passwordChange(
    @Req() req: Request & { user?: { _id?: string } },
    @Res() res: Response,
    @Body() passchangeDto: PasswordChangeDto
  ) {
    if (!req.user || !req.user._id) {
      throw new Error('User ID is missing from request');
    }
    return this.authService.changePassword(
      req.user._id,
      passchangeDto.prevPassword,
      passchangeDto.newPassword,
      res
    );
  }

  @Get('password-reset-request/')
  async otp(@Body('email') email: string) {
    return this.authService.sendOtp(email);
  }

  @Post('password-reset')
  async passwordReset( @Query('token') token:string ,@Body() passResetDto: PassresetDto,) {
    return this.authService.resetPassword(token,passResetDto.password);
  }
}
