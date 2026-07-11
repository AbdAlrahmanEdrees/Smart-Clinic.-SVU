import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEmail, IsEnum, IsInt, IsNotEmpty, IsNumber, IsString, Length, ValidateIf } from "class-validator";
import { UserRole } from "generated/prisma/enums";


export class SignupDto {
    @ApiProperty({
        description: "Role of the user.",
        enum: UserRole,
        example: UserRole.DOCTOR
    })
    @IsEnum(UserRole)
    @IsNotEmpty()
    userRole: UserRole;

    @ApiPropertyOptional({
        description: "Specialty ID. Required only if the user role is DOCTOR.",
        example: 1
    })
    @ValidateIf(o => o.userRole === UserRole.DOCTOR)
    @IsInt({ message: 'If UserRole is DOCTOR, specialtyId must be a valid integer' })
    @IsNotEmpty({ message: 'If UserRole is DOCTOR, specialtyId should be defined' })
    specialtyId?: number;

    @ApiPropertyOptional({
        description: "Consultation Fee. Required only if the user role is DOCTOR.",
        example: 2.25
    })
    @ValidateIf(o => o.userRole === UserRole.DOCTOR)
    // FIXED: Passed strict number options first, then the validation message
    @IsNumber(
        { allowNaN: false, allowInfinity: false, maxDecimalPlaces: 2 },
        { message: 'If UserRole is DOCTOR, consultation fee must be a valid float with up to 2 decimal places' }
    )
    @IsNotEmpty({ message: 'If UserRole is DOCTOR, consultation fee should be defined' })
    consultationFee?: number;


    @ApiProperty({ description: "username, should be 3-30 characters" })
    @IsString()
    @Length(3, 30, { message: "username should be 3-30 characters long" })
    name: string;

    @IsEmail()
    @ApiProperty({ description: "any valid email address" })
    email: string;

    @IsString()
    @ApiProperty({ description: "string", example: "+963 911111111, 0911111111" })
    phone: string;

    @ApiProperty({ description: "6-30 charachters long password", example: "123456" })
    @IsString()
    @Length(6, 30, { message: "password should be 6-30 characters long" })
    password: string;
}