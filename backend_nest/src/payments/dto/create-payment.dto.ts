import { IsBoolean, IsIn, IsMongoId, IsOptional } from 'class-validator';
import { PAYMENT_METHODS } from '../payment.schema';

export class CreatePaymentDto {
  @IsMongoId({ message: 'La orden debe ser un ID válido de MongoDB' })
  order!: string;

  @IsIn(PAYMENT_METHODS)
  method!: string;

  // Solo para la simulación: fuerza que el pago sea rechazado
  @IsBoolean()
  @IsOptional()
  simulateFailure?: boolean;
}
