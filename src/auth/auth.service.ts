import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  NotAcceptableException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import * as bcrypt from 'bcrypt';
import { User } from 'src/database/database.types';
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
import { sendOtpEmail, sendPasswordResetEmail } from 'src/lib/mail';
import { RequestWithAuth } from './auth.controller';
import { Action } from 'src/casl/actionEnum';

export type UserPayload = {
  role: UserRole;
  id: number;
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
  id: number;
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

  async login(identifier: string, password: string, res: Response): Promise<any> {
    try {
      let foundUser: User = await this.userService.findOne(identifier);

      if (!foundUser) {
        throw new NotFoundException('User account does not exists !');
      }

      let isPasswordMatched = await bcrypt.compare(
        password,
        foundUser.password,
      );

      if (!isPasswordMatched) {
        throw new NotAcceptableException('Wrong credentials !');
      }

      // generating security tokens with jsonwebtoken

      const payload = {
        role: foundUser.role,
        id: foundUser.id,
      };

      const accessToken = await this.jwtService.signAsync(payload);
      // const { cookieValue, expiresAt } =
      //   await this.refreshTokenService.createToken(foundUser.id);

      // res.cookie('refresh_token', cookieValue, {
      //   httpOnly: true,
      //   secure: true,
      //   sameSite: 'lax',
      //   expires: expiresAt,
      // });

      // Set accessToken cookie with 15 minutes expiry
      const accessTokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        expires: accessTokenExpiry,
      });

      return res.status(200).json({
        user: {
          name: foundUser.full_name,
          username: foundUser.username,
        },
      });
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // async loginByGoogle(res: Response, code: string): Promise<any> {
  //   try {
  //     const user: GoogleUser = await this.fetchFromGoogle(code);

  //     let foundUser: UserDocument = await this.userService.findOne(user.email);

  //     if (!foundUser) {
  //       throw new NotFoundException('User account does not exists !');
  //     }

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

  async logout(req: Request, res: Response): Promise<any> {
    const token = req.cookies['refresh_token'];

    if (token) {
      const [id, r] = token.split('.');
      await this.refreshTokenService.revoke(id);
      res.clearCookie('refresh_token');
    }

    // Clear accessToken cookie
    res.clearCookie('accessToken');

    res.json({ message: 'Logged out successfully' }).send();
  }

  async register(userBody: CreateUserDto, res: Response): Promise<any> {
    try {
      let createdUser: User = await this.userService.create(userBody);

      // generating security tokens with jsonwebtoken

      const payload = {
        role: createdUser.role,
        id: createdUser.id,
      };

      const accessToken = await this.jwtService.signAsync(payload);
      const { cookieValue, expiresAt } =
        await this.refreshTokenService.createToken(createdUser.id);

      res.cookie('refresh_token', cookieValue, {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        expires: expiresAt,
      });

      // Set accessToken cookie with 15 minutes expiry
      const accessTokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        expires: accessTokenExpiry,
      });

      return res.status(200).json({
        user: {
          name: createdUser.full_name,
          username: createdUser.username,
        },
      });
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // async registerByGoogle(res: Response, code: string): Promise<any> {
  //   try {
  //     const user = await this.fetchFromGoogle(code);
  //     // 3. Prepare the redirect URL with user data
  //     //   const userParam = encodeURIComponent(JSON.stringify(user));
  //     const redirectUrl = `http://localhost:3000/profile?user=`;

  //     const newUser: CreateUserDto = {
  //       name: user.name,
  //       email: user.email,
  //       password: generateRandomPassword(),
  //     };

  //     let createdUser: UserDocument = await this.userService.create(newUser);

  //     // generating security tokens with jsonwebtoken

  //     const payload = {
  //       role: createdUser.role,
  //       _id: createdUser._id,
  //     };

  //     const accessToken = await this.jwtService.signAsync(payload);
  //     const { cookieValue, expiresAt } =
  //       await this.refreshTokenService.createToken(createdUser._id);

  //     res.cookie('refresh_token', cookieValue, {
  //       httpOnly: true,
  //       secure: true,
  //       sameSite: 'lax',
  //       expires: expiresAt,
  //     });

  //     return res.status(200).json({
  //       user: {
  //         name: createdUser.name,
  //         pfp: createdUser.pfp,
  //       },
  //       accessToken,
  //       url: redirectUrl,
  //     });
  //   } catch (error) {
  //     throw new BadRequestException(error.message);
  //   }
  // }

  // async fetchFromGoogle(code: string): Promise<GoogleUser> {
  //   const tokenUrl = 'https://oauth2.googleapis.com/token';
  //   const tokenParams = {
  //     code,
  //     client_id: this.configService.get<string>('GOOGLE_CLIENT_ID'),
  //     client_secret: this.configService.get<string>('GOOGLE_CLIENT_SECRET'),
  //     redirect_uri: 'http://localhost:3000/api/google/callback', // Your NestJS redirect URI
  //     grant_type: 'authorization_code',
  //   };

  //   // Use URLSearchParams to encode the body as x-www-form-urlencoded
  //   const body = new URLSearchParams(
  //     tokenParams as Record<string, string>,
  //   ).toString();

  //   // Import firstValueFrom at the top: import { firstValueFrom } from 'rxjs';
  //   const tokenResponse = await firstValueFrom(
  //     this.httpService.post(tokenUrl, body, {
  //       headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  //     }),
  //   );
  //   const tokens = tokenResponse.data;

  //   // 2. Get user info with the access token
  //   const userInfoUrl = 'https://www.googleapis.com/oauth2/v3/userinfo';
  //   const userInfoResponse = await firstValueFrom(
  //     this.httpService.get(userInfoUrl, {
  //       headers: { Authorization: `Bearer ${tokens.access_token}` },
  //     }),
  //   );

  //   const user: GoogleUser = userInfoResponse.data;
  //   return user;
  // }

  async changePassword(
    req: RequestWithAuth,
    prevPassword: string,
    newPassword: string,
    res: Response,
  ): Promise<any> {
    let foundUser: User = await this.userService.findOne(req.user.id);

    if (!foundUser) {
      throw new NotFoundException('User account does not exists !');
    }

    let passwordMatch = await bcrypt.compare(prevPassword, foundUser.password);

    if (!passwordMatch) {
      throw new NotAcceptableException('Wrong credentials !');
    }

    const saltOrRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltOrRounds);

    // update password in db
    await this.userService.updateOne(req.user.id, { password: hashedPassword });

    // generating security tokens with jsonwebtoken

    const payload = {
      role: foundUser.role,
      id: foundUser.id,
    };

    // revoking all logged in refresh tokens

    await this.refreshTokenService.revokeAllForUser(foundUser.id);

    const accessToken = await this.jwtService.signAsync(payload);
    const { cookieValue, expiresAt } =
      await this.refreshTokenService.createToken(foundUser.id);

    res.cookie('refresh_token', cookieValue, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      expires: expiresAt,
    });

    // Set accessToken cookie with 15 minutes expiry
    const accessTokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      expires: accessTokenExpiry,
    });

    return res.status(200).json({
      user: {
        name: foundUser.full_name,
        username: foundUser.username,
      },
    });
  }

  async resetPassword(token: string, newPassword: string): Promise<any> {
    try {
      // Validate reset token using refresh token logic (one-time use)
      const { userId } = await this.refreshTokenService.validateOneTimeToken(token);
      
      let foundUser: User = await this.userService.findOne(userId);

      if (!foundUser) {
        throw new NotFoundException('User account does not exists !');
      }

      const saltOrRounds = 10;
      const hashedPassword = await bcrypt.hash(newPassword, saltOrRounds);

      // update password in db
      await this.userService.updateOne(foundUser.id, { password: hashedPassword });

      // revoking all logged in refresh tokens since password changed
      await this.refreshTokenService.revokeAllForUser(foundUser.id);

      return {
        message: 'Password reset was successful !',
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async forgotPassword(identifier: string) {
    try {
      const user = await this.userService.findOne(identifier);
      if (!user) {
        // We don't want to leak if a user exists or not, but usually for reset we can say "if exists, email sent"
        return { message: 'If an account exists, a reset link has been sent.' };
      }

      // Generate a reset token valid for 5 minutes
      const { cookieValue } = await this.refreshTokenService.createToken(
        user.id,
        0,
        5,
      );

      const resetLink = `${this.configService.get('FRONTEND_URL') || 'http://localhost:3000'}/reset-password?token=${cookieValue}`;

      await sendPasswordResetEmail(user.email, resetLink);

      return { message: 'Reset link sent successfully' };
    } catch (error) {
      // return success anyway to prevent email enumeration
      return { message: 'If an account exists, a reset link has been sent.' };
    }
  }

  async sendOtp(email: string) {
    try {
      let foundUser: User = await this.userService.findOne(email);

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
      let foundUser: User = await this.userService.findOne(email);

      if (!foundUser) {
        throw new NotFoundException('User account does not exists !');
      }

      const token = await this.jwtService.signAsync({ id: foundUser.id });

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

    const { cookieValue, expiresAt, userId } =
      await this.refreshTokenService.validateAndRotate(token);

    const foundUser = await this.userService.findOne(userId);

    const payload = {
      id: userId,
      role: foundUser.role,
    };
    const newAccessToken = await this.jwtService.signAsync(payload);

    res.cookie('refresh_token', cookieValue, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      expires: expiresAt,
    });

    // Set accessToken cookie with 15 minutes expiry
    const accessTokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    res.cookie('accessToken', newAccessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      expires: accessTokenExpiry,
    });

    return res
      .status(200)
      .json({ message: 'Access token refreshed successfully' });
  }

  async getCurrentUser(userId: string): Promise<any> {
    const user: User = await this.userService.findOne(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Return public user information (exclude password)
    return {
      id: user.id,
      username: user.username,
      full_name: user.full_name,
      email: user.email,
      bio: user.bio,
      role: user.role,
      profile_pic_id: user.profile_pic_id,
      cover_pic_id: user.cover_pic_id,
      created_at: user.created_at,
    };
  }
}
