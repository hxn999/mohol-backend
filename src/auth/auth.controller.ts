import { BadRequestException, Controller, Delete, Get, HttpCode, HttpStatus, Post, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Response } from 'express';

@Controller('auth')
export class AuthController {
    constructor(private authService:AuthService){}


    @Post('signin')
    signIn()
    {

    }

    @Post('register')
    register()
    {

    }


    @Delete('logout')
    logOut(@Res() res:Response)
    {
        try {
            res.clearCookie("accessToken")

        } catch (error) {
            throw new BadRequestException(error.message)
        }
    }



}
