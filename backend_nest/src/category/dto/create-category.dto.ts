import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @IsOptional()
  _id?: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  slug!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
