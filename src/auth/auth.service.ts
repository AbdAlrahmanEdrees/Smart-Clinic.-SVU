import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import bcrypt from 'bcrypt';
import { Tokens } from './types';
import { JwtService } from '@nestjs/jwt';
// import * as env from 'dotenv';
import { SignupDto } from './dto/signup.dto';
import { SignInDto } from './dto/signin.dto';
import { EmailService } from 'src/auth/email/email.service';
import { UserApprovalStatus, UserRole } from 'generated/prisma/enums';
import { VerifingDto } from './dto/verification.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
// env.config();
@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
        private emailService: EmailService
    ) { }



    async signupLocal(dto: SignupDto): Promise<{user_id:string}> {
        // Use findUnique() to benefit from the unique index on email
        const existingUser = await this.prisma.user.findFirst({
            where: {
                OR:[
                    {email:dto.email},
                    {phone:dto.phone}
                ]
            },
        });

        if (existingUser) {
            const message ="common.errors.email_or_phone_already_rigistered";
            throw new ForbiddenException(message);
        }

        // ************************************************
        // ***********Email Verification Code**************
        // ************************************************     
        const hashedPassword = await this.hashData(dto.password);

        const newUser = await this.prisma.user.create({
            data: {
                fullName: dto.name,                
                email: dto.email,
                phone: dto.phone,
                hashedPassword: hashedPassword,

            },
        });

        if(dto.userRole == UserRole.DOCTOR){
            await this.prisma.doctor.create({
                data:{
                    userId: newUser.id,
                    specialtyId: dto.specialtyId!,
                    consultationFee: dto.consultationFee!
                }
            })
        }
        this.sendVerificationCode(newUser.id);
        // const tokens = await this.getTokens(newUser.id, newUser.email);

        // await this.updateRtHash(newUser.id, tokens.refresh_token);

        // return tokens;
        return {user_id: newUser.id};
    }


    async signinLocal(dto: SignInDto): Promise<Tokens> {
        var user;
        if (!dto.phone) {
            user = await this.prisma.user.findUnique({
                where: {
                    email: dto.email
                }
            });
        } else {
            user = await this.prisma.user.findUnique({
                where: {
                    phone: dto.phone
                }
            });
        }
        if (!user) {
            const errMsg = "email_or_password_incorrect";
            throw new UnauthorizedException(errMsg);
        }
        const passwordMatches = await bcrypt.compare(dto.password, user.hashedPassword);

        if (!passwordMatches) {
            const errMsg = "email_or_password_incorrect";
            throw new UnauthorizedException(errMsg);
        }
        if (user.approvalStatus == UserApprovalStatus.BANNED) {
            const d = user.banEndsAt!;
            const formatted = `${d.getDate()}-${d.getMonth() + 1}-${d.getFullYear()}`
            const errMsg = "this_account_is_banned_until" + formatted;

            throw new UnauthorizedException(errMsg);
        }
        if (user.approvalStatus == UserApprovalStatus.NOT_VERIFIED) {
            const errMsg = "enter_verification_code";
            throw new UnauthorizedException({
                error: "EmailNotVerified",
                message: errMsg,
                requireVerification: true,
                user_id: user.id
            });
        }
        const tokens = await this.getTokens(user.id, user.email);

        await this.updateRtHash(user.id, tokens.refresh_token);

        return tokens;

    }

    async logout(userId: string) {
        await this.prisma.user.updateMany({
            where: {
                id: userId,
                hashedRt: {
                    not: null
                }
            },
            data: {
                hashedRt: null
            }
        })

    }

    async resetPassword(dto: ResetPasswordDto) {
        const user = await this.prisma.user.findUnique({
            where: {
                id: dto.userId,
                email: dto.email
            }
        });
        if (!user) {
            throw new ForbiddenException();
        }
        if (user.verificationCodeExpiresAt! < new Date(Date.now()) ||
            user.verificationCode != dto.code) {
            throw new ForbiddenException();
        }
        const hashedPassword = await this.hashData(dto.newPassword);
        await this.prisma.user.update({
            where: {
                id: dto.userId
            },
            data: {
                hashedPassword: hashedPassword
            }
        });

    }

    async verifyAccount(dto: VerifingDto): Promise<Tokens> {
        const user = await this.prisma.user.findUnique({ where: { id: dto.userId } });

        if (!user?.verificationCodeExpiresAt) {
            const errMsg = "email_or_password_incorrect";
            throw new ForbiddenException(errMsg);
        }

        const now = new Date();

        if (user.verificationCodeExpiresAt < now || user.verificationCode !== dto.code) {
            const errMsg = "verification_code_mismatch";
            throw new ForbiddenException(errMsg);
        }

        await this.prisma.user.update({where:{id:dto.userId},data:{approvalStatus:'VERIFIED'}});

        const tokens = await this.getTokens(user.id, user.email);
        await this.updateRtHash(user.id, tokens.refresh_token);
        return tokens;
    }


    async refreshTokens(userId: string, rt: string): Promise<Tokens> {
        const user = await this.prisma.user.findUnique({
            where: {
                id: userId
            }
        });
        if (!user?.hashedRt) {
            const errMsg = "access_denied";
            throw new ForbiddenException(errMsg);
        }
        if (user.approvalStatus == UserApprovalStatus.BANNED) {
            if (user.banEndsAt! < new Date(Date.now())) {
                const banEndsAt = user.banEndsAt!.getDay().toString() + "-" +
                    user.banEndsAt!.getMonth().toString() + "-" +
                    user.banEndsAt!.getFullYear().toString();
                const errMsg = "this_account_is_banned_until" + banEndsAt;

                throw new ForbiddenException(errMsg);
            }
            await this.prisma.user.update({
                where: {
                    id: user.id
                },
                data: {
                    approvalStatus: UserApprovalStatus.VERIFIED
                }
            })
        }
        const rtMatches = await bcrypt.compare(rt, user.hashedRt);
        if (!rtMatches) {
            const errMsg = "access_denied";
            throw new ForbiddenException(errMsg);
        }

        const tokens = await this.getTokens(user.id, user.email);

        await this.updateRtHash(user.id, tokens.refresh_token);

        return tokens;
    }

    async sendVerificationCode(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: {
                id: userId
            }
        });
        if (!user) {
            throw new ForbiddenException();
        }
        if (user.verificationCodeExpiresAt) {
            const expiresAt = user.verificationCodeExpiresAt.getTime();

            const lastSentAt = expiresAt - 10 * 60 * 1000;        // subtract 10 minutes
            const nextAllowedSendAt = lastSentAt + 60 * 1000;     // +1 minute cooldown

            if (Date.now() < nextAllowedSendAt) {
                throw new ForbiddenException(
                    "try_again_later"
                );
                // throw new ForbiddenException();
            }
        }

        const code = Math.floor(10000 + Math.random() * 90000);
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        await this.emailService.sendVerificationCode(user.email, code);
        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                verificationCode: code,
                verificationCodeExpiresAt: expiresAt
            }
        });
    }



    /*
    helper function:
    */


    hashData(data: string) {
        return bcrypt.hash(data, 10);
    }

    async getTokens(userId: string, email: string) {
        // you can use whatever data you want.
        // But it should be public data, not something like password.
        const payload = {
            sub: userId,
            email: email
        };

        const accessToken = await this.jwtService.signAsync(payload, {
            secret: process.env.AT_SECRET,
            expiresIn: 10, //1 minutes
        });

        const refreshToken = await this.jwtService.signAsync(payload, {
            secret: process.env.RT_SECRET,
            expiresIn: 60 * 60 * 24 * 30 //a month
        });
        return {
            access_token: accessToken,
            refresh_token: refreshToken

        }
    }

    async updateRtHash(userId: string, refreshToken: string) {
        const rtHashed = await this.hashData(refreshToken);
        await this.prisma.user.update({
            where: { id: userId }, data: {
                hashedRt: rtHashed,
            }
        });

    }

}
