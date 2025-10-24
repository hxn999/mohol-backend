import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { Product, ProductDocument } from './schemas/product.schema';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductsDto } from './dto/query-products.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
  ) {}

  async create(createDto: CreateProductDto) {
    const created = await this.productModel.create(createDto);
    return created;
  }

  async findAll(queryDto: QueryProductsDto) {
    const {
      page = 1,
      limit = 10,
      tags,
      category,
      minPrice,
      maxPrice,
    } = queryDto;

    const filter: FilterQuery<ProductDocument> = {};
    if (tags && tags.length > 0) {
      filter.tags = { $in: tags };
    }
    if (category && category.length > 0) {
      filter.category = { $in: category };
    }
    if (minPrice != null || maxPrice != null) {
      filter.price = {} as any;
      if (minPrice != null) (filter.price as any).$gte = minPrice;
      if (maxPrice != null) (filter.price as any).$lte = maxPrice;
    }

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.productModel
        .find(filter)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean(),
      this.productModel.countDocuments(filter),
    ]);

    return {
      items,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async findOne(id: string) {
    const product = await this.productModel.findById(id).lean();
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async update(id: string, updateDto: UpdateProductDto) {
    const updated = await this.productModel
      .findByIdAndUpdate(id, updateDto, { new: true })
      .lean();
    if (!updated) throw new NotFoundException('Product not found');
    return updated;
  }

  async remove(id: string) {
    const deleted = await this.productModel.findByIdAndDelete(id).lean();
    if (!deleted) throw new NotFoundException('Product not found');
    return { deleted: true };
  }
}
