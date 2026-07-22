import { PartialType } from '@nestjs/mapped-types';
import { IsIn, IsOptional } from 'class-validator';
import { CreateOrderDto } from './create-order.dto';
import { ORDER_STATUSES } from '../order.schema';

export class UpdateOrderDto extends PartialType(CreateOrderDto) {
  @IsIn(ORDER_STATUSES)
  @IsOptional()
  status?: string;
}
