import {
  ArrayMinSize,
  IsArray,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

// El cliente solo envía el producto y la cantidad;
// el nombre y precio se toman de la BD en el servidor
export class CreateOrderItemDto {
  @IsMongoId({ message: 'El producto debe ser un ID válido de MongoDB' })
  product!: string;

  @IsNumber()
  @Min(1)
  @Type(() => Number)
  quantity!: number;
}

export class ShippingAddressDto {
  @IsString()
  @IsNotEmpty()
  street!: string;

  @IsString()
  @IsNotEmpty()
  city!: string;

  @IsString()
  @IsNotEmpty()
  zipCode!: string;
}

export class CreateOrderDto {
  @IsMongoId({ message: 'El usuario debe ser un ID válido de MongoDB' })
  user!: string;

  @IsArray()
  @ArrayMinSize(1, { message: 'La orden debe tener al menos un item' })
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items!: CreateOrderItemDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shippingAddress?: ShippingAddressDto;
}
