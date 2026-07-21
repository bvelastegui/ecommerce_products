import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { diskStorage } from 'multer';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { extname } from 'path';

// El prefijo 'products' significa que todas estas rutas colgarán de /products
@Controller('products')
export class ProductsController {
  constructor(private readonly productService: ProductsService) {}

  @Post()
  @UseInterceptors(
    FilesInterceptor('images', 5, {
      // Máximo 5 imágenes
      storage: diskStorage({
        destination: './uploads', // Asegúrate de crear esta carpeta en la raíz de tu proyecto
        filename: (req, file, callback) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          callback(null, `${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  create(
    @Body() createProductDto: CreateProductDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const slug = createProductDto.name
      .toLowerCase()
      .trim()
      .replace(/[\s\W-]+/g, '-');
    const imagePaths = files
      ? files.map((file) => `/uploads/${file.filename}`)
      : [];

    const productData = {
      ...createProductDto,
      images: imagePaths,
      slug,
    };

    return this.productService.create(productData);
  }

  @Get()
  findAll() {
    return this.productService.findAll();
  }

  // Ruta específica para el slug (ej: /products/slug/mi-producto)
  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.productService.findBySlug(slug);
  }

  // Ruta dinámica para el ID (ej: /products/60d5ecb54b1234567890abcd)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productService.update(id, updateProductDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productService.remove(id);
  }
}
