import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString, ValidateIf } from "class-validator";

export class SignInDto {
    @ApiPropertyOptional({
        description: "Email of the user. Required if phone is not provided.",
        example: "user@example.com"
    })
    @ValidateIf(o => !o.phone) // Require email if phone is missing
    @IsEmail()
    @IsNotEmpty()
    email?: string;

    @ApiPropertyOptional({
        description: "Phone of the user. Required if email is not provided.",
        examples: ["+963 911111111", "0911111111", "911111111"]
    })
    @ValidateIf(o => !o.email) // Require phone if email is missing
    @IsString()
    @IsNotEmpty()
    phone?: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    password: string;
}