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

  @Get('otp/:email')
  async otp(@Param('email') email: string) {
    return this.authService.sendOtp(email);
  }

  @Post('password-reset')
  async passwordReset(
    @Res() res: Response,
    @Body() passResetDto: PassresetDto,
  ) {
    return this.authService.verifyOtpAndChangePassword(
      passResetDto.email,
      passResetDto.otp,
      passResetDto.password,
      res,
    );
  }
}
