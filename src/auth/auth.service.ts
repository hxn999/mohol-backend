import { BadRequestException, Injectable, NotAcceptableException, NotFoundException } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import * as bcrypt from 'bcrypt'
import { User, UserDocument } from 'src/user/schemas/user.schema';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto } from 'src/user/dto/createUserDto';
import { UserRole } from 'src/user/userRolesEnum';


export type UserPayload = {
    name: string,
    email:string,
    role: UserRole,
    _id: string,
}

@Injectable()
export class AuthService {

    constructor(
        private userService: UserService,
        private jwtService: JwtService
    ) { }

    async signIn(email: string, password: string): Promise<any> {
        try {
            let foundUser: UserDocument = await this.userService.findOne(email)

            if (!foundUser) {
                throw new NotFoundException("User account does not exists !")
            }

            let passwordMatch = await bcrypt.compare(password, foundUser.password);

            if (!passwordMatch) {
                throw new NotAcceptableException("Wront credentials !")
            }


            // generating security tokens with jsonwebtoken

            const payload = {
                name: foundUser.name,
                email: foundUser.email,
                role: foundUser.role,
                _id: foundUser._id,
            }

            const accessToken = await this.jwtService.signAsync(payload)
            const refreshToken = await this.jwtService.signAsync(payload, { expiresIn: '30d' })


            return {
                user: {
                    name: foundUser.name,
                    email: foundUser.email,
                    institute: foundUser.institute,
                    pfp: foundUser.pfp,
                    role: foundUser.role,
                    phone: foundUser.phone,
                    _id: foundUser._id,
                },
                accessToken,
                refreshToken,
            }


        } catch (error) {
            throw new BadRequestException(error.message)
        }
    }


    async register(userBody: CreateUserDto): Promise<any> {
        try {
            let createdUser: UserDocument = await this.userService.create(userBody)

            // generating security tokens with jsonwebtoken

            const payload = {
                name: createdUser.name,
                email: createdUser.email,
                role: createdUser.role,
                _id: createdUser._id,
            }

            const accessToken = await this.jwtService.signAsync(payload)
            const refreshToken = await this.jwtService.signAsync(payload, { expiresIn: '30d' })


            return {
                user: {
                    name: createdUser.name,
                    email: createdUser.email,
                    institute: createdUser.institute,
                    pfp: createdUser.pfp,
                    role: createdUser.role,
                    phone: createdUser.phone,
                    _id: createdUser._id,
                },
                accessToken,
                refreshToken,
            }


        } catch (error) {
            throw new BadRequestException(error.message)
        }
    }



}
