// create-payment.dto.ts
import { IsNotEmpty, IsString, IsNumber, IsArray, ArrayNotEmpty } from 'class-validator';

export class CreatePaymentDto {
  @IsNumber()
  userId: number;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  courseIds: string[]; // cambia courseId por courseIds
}

export class ConfirmPaymentDto {
  @IsString()
  @IsNotEmpty()
  paymentId: string;

  @IsString()
  @IsNotEmpty()
  externalChargeId: string;
}
