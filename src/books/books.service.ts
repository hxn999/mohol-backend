import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Book, BookDocument } from './schemas/book.schema';
import { DeleteResult, Model, Types, UpdateWriteOpResult } from 'mongoose';
import { CreateBookDto } from './dto/createBookDto';
import { UpdateBookDto } from './dto/updateBookDto';

@Injectable()
export class BooksService {

    constructor(
        @InjectModel(Book.name) private bookModel: Model<Book>,
    ) { }

    async create(book: CreateBookDto): Promise<BookDocument> {
        try {
            const createdBook = new this.bookModel(book);
            return await createdBook.save();
        } catch (error) {
            throw new BadRequestException(error.message);
        }
    }

    async findOne(id: string): Promise<BookDocument> {
        try {
            const bookId = new Types.ObjectId(id)
            const foundBook = await this.bookModel.findById(bookId);

            if (!foundBook) {
                throw new NotFoundException("Book Not Found !")
            }
            return foundBook;
        } catch (error) {
            throw new BadRequestException(error.message);
        }
    }

    async findMany(query: Object): Promise<BookDocument[]> {
        try {
            let foundBooks = await this.bookModel.find(query).exec();

            if (!foundBooks) {
                throw new NotFoundException(`Books with ${query} not found`);
            }
            return foundBooks;

        } catch (error) {
            throw new BadRequestException(error.message);
        }
    }

    async findAll(): Promise<BookDocument[]> {
        try {
            let foundBooks = await this.bookModel.find().exec();
            return foundBooks;
        } catch (error) {
            throw new BadRequestException(error.message);
        }
    }

    async deleteOne(id: string): Promise<DeleteResult> {
        try {
            const bookId = new Types.ObjectId(id)
            const deletedBook = await this.bookModel.deleteOne({ _id: bookId });

            if (!deletedBook) {
                throw new NotFoundException("Book Not Found !")
            }
            return deletedBook;
        } catch (error) {
            throw new BadRequestException(error.message);
        }
    }

    async updateOne(id: string, updatedBook: UpdateBookDto): Promise<UpdateWriteOpResult> {
        try {
            const bookId = new Types.ObjectId(id)
            let updatedBookResult = await this.bookModel.updateOne({ _id: bookId }, { $set: updatedBook }).exec();

            return updatedBookResult;
        } catch (error) {
            throw new BadRequestException(error.message);
        }
    }

    async findByTitle(title: string): Promise<BookDocument[]> {
        try {
            const foundBooks = await this.bookModel.find({
                title: { $regex: title, $options: 'i' }
            }).exec();

            return foundBooks;
        } catch (error) {
            throw new BadRequestException(error.message);
        }
    }

    async findByTags(tags: string[]): Promise<BookDocument[]> {
        try {
            const foundBooks = await this.bookModel.find({
                tags: { $in: tags }
            }).exec();

            return foundBooks;
        } catch (error) {
            throw new BadRequestException(error.message);
        }
    }

}
