import {
  BadRequestException,
  Injectable,
  NotAcceptableException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from 'src/user/schemas/user.schema';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto } from 'src/user/dto/createUserDto';
import { UserRole } from 'src/user/userRolesEnum';
import { totp, authenticator } from 'otplib';
import { RefreshTokenService } from './refreshToken.service';
import { Request, Response } from 'express';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { generateRandomPassword } from 'src/lib/randomPassGen';
import { sendOtpEmail } from 'src/lib/mail';
import { jwtConstants } from './constants';
import { Mongoose, Types } from 'mongoose';

export type UserPayload = {
  name: string;
  email: string;
  role: UserRole;
  _id: string;
};

type GoogleUser = {
  sub: string;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  email: string;
  email_verified?: boolean;
  locale?: string;
};

type ResetPayload = {
  _id: string;
};

@Injectable()
export class AuthService {
  private emailSecretMap: any = {};

  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private refreshTokenService: RefreshTokenService,
    private httpService: HttpService,
    private configService: ConfigService,
  ) {}

  async login(email: string, password: string, res: Response): Promise<any> {
    try {
      let foundUser: UserDocument = await this.userService.findOne(email);

      if (!foundUser) {
        throw new NotFoundException('User account does not exists !');
      }

      let isPasswordMatched = await bcrypt.compare(
        password,
        foundUser.password,
      );

      if (!isPasswordMatched) {
        throw new NotAcceptableException('Wront credentials !');
      }

      // generating security tokens with jsonwebtoken

      const payload = {
        role: foundUser.role,
        _id: foundUser._id,
      };

      const accessToken = await this.jwtService.signAsync(payload);
      const { cookieValue, expiresAt } =
        await this.refreshTokenService.createToken(foundUser._id);

      res.cookie('refresh_token', cookieValue, {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        expires: expiresAt,
      });

      return res.status(200).json({
        user: {
          name: foundUser.name,
          pfp: foundUser.pfp,
        },
        accessToken,
      });
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async loginByGoogle(res: Response, code: string): Promise<any> {
    try {
      const user: GoogleUser = await this.fetchFromGoogle(code);

      let foundUser: UserDocument = await this.userService.findOne(user.email);

      if (!foundUser) {
        throw new NotFoundException('User account does not exists !');
      }

      // generating security tokens with jsonwebtoken

      const payload = {
        role: foundUser.role,
        _id: foundUser._id,
      };

      const accessToken = await this.jwtService.signAsync(payload);
      const { cookieValue, expiresAt } =
        await this.refreshTokenService.createToken(foundUser._id);

      res.cookie('refresh_token', cookieValue, {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        expires: expiresAt,
      });

      return res.status(200).json({
        user: {
          name: foundUser.name,
          pfp: foundUser.pfp,
        },
        accessToken,
      });
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async logout(req: Request, res: Response) {
    const token = req.cookies['refresh_token'];
    if (token) {
      const [id] = token.split('.');
      await this.refreshTokenService.revoke(id);
      res.clearCookie('refresh_token');
    }
    return { message: 'Logged out successfully' };
  }

  async register(userBody: CreateUserDto, res: Response): Promise<any> {
    try {
      let createdUser: UserDocument = await this.userService.create(userBody);

      // generating security tokens with jsonwebtoken

      const payload = {
        role: createdUser.role,
        _id: createdUser._id,
      };

      const accessToken = await this.jwtService.signAsync(payload);
      const { cookieValue, expiresAt } =
        await this.refreshTokenService.createToken(createdUser._id);

      res.cookie('refresh_token', cookieValue, {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        expires: expiresAt,
      });

      return res.status(200).json({
        user: {
          name: createdUser.name,
          pfp: createdUser.pfp,
        },
        accessToken,
      });
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async registerByGoogle(res: Response, code: string): Promise<any> {
    try {
      const user = await this.fetchFromGoogle(code);
      // 3. Prepare the redirect URL with user data
      //   const userParam = encodeURIComponent(JSON.stringify(user));
      const redirectUrl = `http://localhost:3000/profile?user=`;

      const newUser: CreateUserDto = {
        name: user.name,
        email: user.email,
        pfp: user.picture,
        password: generateRandomPassword(),
      };

      let createdUser: UserDocument = await this.userService.create(newUser);

      // generating security tokens with jsonwebtoken

      const payload = {
        role: createdUser.role,
        _id: createdUser._id,
      };

      const accessToken = await this.jwtService.signAsync(payload);
      const { cookieValue, expiresAt } =
        await this.refreshTokenService.createToken(createdUser._id);

      res.cookie('refresh_token', cookieValue, {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        expires: expiresAt,
      });

      return res.status(200).json({
        user: {
          name: createdUser.name,
          pfp: createdUser.pfp,
        },
        accessToken,
        url: redirectUrl,
      });
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async fetchFromGoogle(code: string): Promise<GoogleUser> {
    const tokenUrl = 'https://oauth2.googleapis.com/token';
    const tokenParams = {
      code,
      client_id: this.configService.get<string>('GOOGLE_CLIENT_ID'),
      client_secret: this.configService.get<string>('GOOGLE_CLIENT_SECRET'),
      redirect_uri: 'http://localhost:3000/api/google/callback', // Your NestJS redirect URI
      grant_type: 'authorization_code',
    };

    // Use URLSearchParams to encode the body as x-www-form-urlencoded
    const body = new URLSearchParams(
      tokenParams as Record<string, string>,
    ).toString();

    // Import firstValueFrom at the top: import { firstValueFrom } from 'rxjs';
    const tokenResponse = await firstValueFrom(
      this.httpService.post(tokenUrl, body, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }),
    );
    const tokens = tokenResponse.data;

    // 2. Get user info with the access token
    const userInfoUrl = 'https://www.googleapis.com/oauth2/v3/userinfo';
    const userInfoResponse = await firstValueFrom(
      this.httpService.get(userInfoUrl, {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      }),
    );

    const user: GoogleUser = userInfoResponse.data;
    return user;
  }

  async changePassword(
    email: string,
    prevPassword: string,
    newPassword: string,
    res: Response,
  ): Promise<any> {
    try {
      let foundUser: UserDocument = await this.userService.findOne(email);

      if (!foundUser) {
        throw new NotFoundException('User account does not exists !');
      }

      let passwordMatch = await bcrypt.compare(
        prevPassword,
        foundUser.password,
      );

      if (!passwordMatch) {
        throw new NotAcceptableException('Wront credentials !');
      }

      const saltOrRounds = 10;
      const hashedPassword = await bcrypt.hash(newPassword, saltOrRounds);

      // update password in db
      this.userService.updateOne(email, { password: hashedPassword });

      // generating security tokens with jsonwebtoken

      const payload = {
        role: foundUser.role,
        _id: foundUser._id,
      };

      // revoking all logged in refresh tokens

      await this.refreshTokenService.revokeAllForUser(foundUser._id);

      const accessToken = await this.jwtService.signAsync(payload);
      const { cookieValue, expiresAt } =
        await this.refreshTokenService.createToken(foundUser._id);

      res.cookie('refresh_token', cookieValue, {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        expires: expiresAt,
      });

      return res.status(200).json({
        user: {
          name: foundUser.name,
          pfp: foundUser.pfp,
        },
        accessToken,
      });
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<any> {
    try {
      const payload: ResetPayload = await this.jwtService.verifyAsync(token, {
        secret: jwtConstants.secret,
      });
      const _id: string = payload._id;
      let foundUser: UserDocument = await this.userService.findOne(_id);

      if (!foundUser) {
        throw new NotFoundException('User account does not exists !');
      }

      const saltOrRounds = 10;
      const hashedPassword = await bcrypt.hash(newPassword, saltOrRounds);

      // update password in db
      this.userService.updateOne(_id, { password: hashedPassword });

      // revoking all logged in refresh tokens
      const userId = new Types.ObjectId(_id);
      await this.refreshTokenService.revokeAllForUser(userId);

      return {
        message: 'Password reset was successful !',
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async sendOtp(email: string) {
    try {
      let foundUser: UserDocument = await this.userService.findOne(email);

      if (!foundUser) {
        throw new NotFoundException('User account does not exists !');
      }

      const secret = authenticator.generateSecret();

      // map the secret to user email

      this.emailSecretMap[email] = secret;

      const otp = totp.generate(this.emailSecretMap[email]);

      //@TODO need to implement bullmq to send mails
      sendOtpEmail(email, otp);

      return { message: 'Sending otp...' };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // async verifyOtpAndChangePassword(
  //   email: string,
  //   otp: string,
  //   newPassword: string,
  //   res: Response,
  // ): Promise<any> {
  //   try {
  //     let foundUser: UserDocument = await this.userService.findOne(email);

  //     if (!foundUser) {
  //       throw new NotFoundException('User account does not exists !');
  //     }

  //     const isOtpVerified = totp.check(otp, this.emailSecretMap[email]);
  //     // changing the secret so that no one can use same otp twice
  //     this.emailSecretMap = 'garbage';

  //     const saltOrRounds = 10;
  //     const hashedPassword = await bcrypt.hash(newPassword, saltOrRounds);

  //     // update password in db
  //     await this.userService.updateOne(email, { password: hashedPassword });

  //     // generating security tokens with jsonwebtoken

  //     const payload = {
  //       role: foundUser.role,
  //       _id: foundUser._id,
  //     };

  //     const accessToken = await this.jwtService.signAsync(payload);
  //     const { cookieValue, expiresAt } =
  //       await this.refreshTokenService.createToken(foundUser._id);

  //     res.cookie('refresh_token', cookieValue, {
  //       httpOnly: true,
  //       secure: true,
  //       sameSite: 'lax',
  //       expires: expiresAt,
  //     });

  //     return res.status(200).json({
  //       user: {
  //         name: foundUser.name,
  //         pfp: foundUser.pfp,
  //       },
  //       accessToken,
  //     });
  //   } catch (error) {
  //     throw new BadRequestException(error.message);
  //   }
  // }
  async sendPasswordResetLink(email: string) {
    try {
      let foundUser: UserDocument = await this.userService.findOne(email);

      if (!foundUser) {
        throw new NotFoundException('User account does not exists !');
      }

      const token = await this.jwtService.signAsync({ _id: foundUser._id });

      //@TODO  to send mail with the reset link
      // sendOtpEmail(email, otp);

      return { message: 'Sending reset link...' };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async refreshAccessToken(req: Request, res: Response) {
    const token = req.cookies['refresh_token'];
    if (!token) throw new UnauthorizedException('No refresh token');

    const { cookieValue, expiresAt } =
      await this.refreshTokenService.validateAndRotate(token);

    const authHeader = req.headers.authorization;
    const tokenFromHeader = authHeader && authHeader.split(' ')[1];
    if (!tokenFromHeader) {
      throw new UnauthorizedException('No authorization token');
    }
    const decodedPayload = this.jwtService.decode(tokenFromHeader);
    const payload = {
      _id: decodedPayload._id,
      role: decodedPayload.role,
    };
    const newAccessToken = await this.jwtService.signAsync(payload);

    res.cookie('refresh_token', cookieValue, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      expires: expiresAt,
    });

    return res.status(200).json({ accessToken: newAccessToken });
  }
}
