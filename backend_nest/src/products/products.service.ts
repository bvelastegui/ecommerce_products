import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
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
    return newProduct.save();
  }

  async findAll(): Promise<Product[]> {
    return (
      this.productModel
        .find()
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
  ): Promise<Product> {
    const updatedProduct = await this.productModel
      .findByIdAndUpdate(id, updateProductDto, { new: true })
      .populate('categoryId')
      .exec();

    if (!updatedProduct) {
      throw new NotFoundException(
        `Producto con ID ${id} no encontrado para actualizar`,
      );
    }

    return updatedProduct;
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
