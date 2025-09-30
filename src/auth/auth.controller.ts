import { BadRequestException, Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Response } from 'express';
import { SigninDto } from './dto/signinDto';
import { CreateUserDto } from 'src/user/dto/createUserDto';
import { PassresetDto } from './dto/passResetDto';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }


    @Post('signin')
    async signIn(@Body() body: SigninDto) {

        return this.authService.signIn(body.email, body.password)
    }

    @Post('register')
    async register(@Body() createUserDto: CreateUserDto) {
        return this.authService.register(createUserDto)
    }


    @Delete('logout')
    async logOut(@Res() res: Response) {
        try {

            res.clearCookie("accessToken")
            res.clearCookie("refreshToken")
            console.log("hiii")
            
            return res.status(200).json({ message: "Logout Successful!" });
        } catch (error) {
            throw new BadRequestException(error.message)
        }
    }

    @Get("otp/:email")
    async otp(@Param('email') email:string)
    {
        return this.authService.sendOtp(email)
    }


    @Post('password-reset')
    async passwordReset(@Body() passResetDto: PassresetDto) {
        return this.authService.verifyOtpAndChangePassword(passResetDto.email,passResetDto.otp,passResetDto.password)
    }



}
