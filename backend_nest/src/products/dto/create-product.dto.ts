import {
  IsArray,
  IsBoolean,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  basePrice?: number;

  @IsMongoId({ message: 'El categoryId debe ser un ID válido de MongoDB' })
  @IsOptional()
  categoryId?: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  stock!: number;

  // En peticiones multipart llega como string JSON con las rutas que se conservan;
  // en peticiones JSON llega directamente como arreglo
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value) as string[];
      } catch {
        return [] as string[];
      }
    }
    return value as string[];
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
