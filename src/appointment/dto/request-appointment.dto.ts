import { ApiProperty } from "@nestjs/swagger";
import { IsDateString, IsInt, IsNotEmpty } from "class-validator";

export class RequestAppointmentDto {
    @ApiProperty({
        description: "The ID of the doctor.",
        example: 1
    })
    @IsInt()
    @IsNotEmpty()
    doctorId: number;

    @ApiProperty({
        description: "The requested date and time in ISO 8601 format.",
        example: "2026-07-20T10:30:00.000Z"
    })
    @IsDateString({ strict: true })
    @IsNotEmpty()
    appointmentDate: string;
} 