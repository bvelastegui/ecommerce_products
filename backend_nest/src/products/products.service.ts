import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { unlink } from 'fs/promises';
import { join } from 'path';
import { Product, ProductDocument } from './product.schema';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    // Inyectamos el modelo para poder usar los métodos de Mongoose
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    // Mongoose convierte automáticamente el categoryId de string a ObjectId
    const newProduct = new this.productModel(createProductDto);
    const savedProduct = await newProduct.save();
    // Populamos la categoría para que la respuesta sea consistente con findAll
    return savedProduct.populate('categoryId');
  }

  async findAll(): Promise<Product[]> {
    return (
      this.productModel
        .find()
        .sort({ createdAt: -1 })
        // Le indicamos el nombre exacto de la propiedad en nuestra clase Product
        .populate('categoryId')
        .exec()
    );
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productModel
      .findById(id)
      .populate('categoryId')
      .exec();

    // Siempre es buena práctica manejar el caso donde el ID no existe
    if (!product) {
      throw new NotFoundException(`Producto con ID ${id} no encontrado`);
    }

    return product;
  }

  // Ejemplo de búsqueda por Slug (muy útil para el frontend)
  async findBySlug(slug: string): Promise<Product> {
    const product = await this.productModel
      .findOne({ slug })
      .populate('categoryId')
      .exec();

    if (!product) {
      throw new NotFoundException(`Producto con slug '${slug}' no encontrado`);
    }

    return product;
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
    files?: Express.Multer.File[],
  ): Promise<Product> {
    const product = await this.productModel.findById(id).exec();

    if (!product) {
      throw new NotFoundException(
        `Producto con ID ${id} no encontrado para actualizar`,
      );
    }

    const { images, ...productData } = updateProductDto;

    // Rutas de los archivos recién subidos
    const newImagePaths = files
      ? files.map((file) => `/uploads/${file.filename}`)
      : [];

    if (images !== undefined) {
      // El cliente envía la lista de imágenes que conserva:
      // las que ya no están se eliminan también del disco
      const removedImages = (product.images ?? []).filter(
        (image) => !images.includes(image),
      );
      await this.deleteFilesFromDisk(removedImages);
      product.images = [...images, ...newImagePaths];
    } else if (newImagePaths.length > 0) {
      // Sin lista explícita, solo agregamos las nuevas
      product.images = [...(product.images ?? []), ...newImagePaths];
    }

    Object.assign(product, productData);

    const updatedProduct = await product.save();
    return updatedProduct.populate('categoryId');
  }

  // Elimina archivos del disco sin bloquear la actualización si alguno falla
  private async deleteFilesFromDisk(imagePaths: string[]) {
    await Promise.all(
      imagePaths.map(async (imagePath) => {
        try {
          await unlink(join(process.cwd(), imagePath));
        } catch {
          // El archivo ya no existe o no se pudo eliminar: lo ignoramos
        }
      }),
    );
  }

  async remove(id: string) {
    // Ejecutamos la eliminación
    const deletedProduct = await this.productModel.findByIdAndDelete(id).exec();

    if (!deletedProduct) {
      throw new NotFoundException(
        `Producto con ID ${id} no encontrado para eliminar`,
      );
    }
  }
}
