import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { BlogPost, BlogPostDocument } from './schemas/blogPost.schema';
import { DeleteResult, Model, Types, UpdateWriteOpResult } from 'mongoose';
import { CreateBlogPostDto } from './dto/createBlogPostDto';
import { CreateCommentDto } from './dto/createCommentDto';
import { CommentDocument } from './schemas/comment.schema';

@Injectable()
export class BlogService {

    constructor(
        @InjectModel(BlogPost.name) private blogPostModel: Model<BlogPost>,
        @InjectModel(Comment.name) private commentModel: Model<Comment>,
    ) { }


    async create(blogPost: CreateBlogPostDto): Promise<BlogPostDocument> {
        try {
            const createdBlogPost = new this.blogPostModel(blogPost);
            return await createdBlogPost.save();
        } catch (error) {

            throw new BadRequestException(error.message);
        }
    }

    async findOne(id: string): Promise<BlogPostDocument> {


        try {

            const blogPostId = new Types.ObjectId(id)
            const foundBlogPost = await this.blogPostModel.findById(blogPostId);

            if (!foundBlogPost) {
                throw new NotFoundException("Blog Post Not Found !")
            }
            return foundBlogPost;
        } catch (error) {

            throw new BadRequestException(error.message);
        }
    }

    async findMany(query: Object): Promise<BlogPostDocument[]> {
        try {
            // matches with email or mongo id

            let foundBlogPosts = await this.blogPostModel.find(query).exec();

            if (!foundBlogPosts) {
                throw new NotFoundException(`BlogPost with  ${query} not found`);
            }
            return foundBlogPosts;

        } catch (error) {
            throw new BadRequestException(error.message);
        }
    }



    async deleteOne(id: string): Promise<DeleteResult> {
        try {

            const blogPostId = new Types.ObjectId(id)
            const deletedBlogPost = await this.blogPostModel.deleteOne({ _id: blogPostId });

            if (!deletedBlogPost) {
                throw new NotFoundException("Blog Post Not Found !")
            }
            return deletedBlogPost;
        } catch (error) {

            throw new BadRequestException(error.message);
        }
    }

    
    async updateOne(id: string, updatedUser): Promise<UpdateWriteOpResult> {
        try {
            // matches with email or mongo id
            const blogPostId = new Types.ObjectId(id)
            let updatedUserResult = await this.blogPostModel.updateOne({ _id: blogPostId }, { $set: updatedUser }).exec();

            return updatedUserResult;
        } catch (error) {
            throw new BadRequestException(error.message);
        }
    }



    async addComment(blogPostId: string, commentDto: CreateCommentDto): Promise<BlogPostDocument> {
        try {

            const blogPost = await this.blogPostModel.findById(blogPostId);
            if (!blogPost) {
                throw new NotFoundException(`Blog Post with ID ${blogPostId} not found.`);
            }


            const createdComment = new this.commentModel(commentDto);
            const savedComment = await createdComment.save();


            blogPost.comments.push(savedComment._id);


            const updatedBlogPost = await blogPost.save();


            return updatedBlogPost.populate('comments');

        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            throw new BadRequestException(error.message);
        }

    }
    async removeComment(blogPostId: string, commentId: string): Promise<BlogPostDocument> {
        // --- Input Validation ---
        if (!Types.ObjectId.isValid(blogPostId) || !Types.ObjectId.isValid(commentId)) {
            throw new BadRequestException('Invalid MongoDB Object ID provided.');
        }

        try {
            // 1. First, find the parent blog post to ensure it exists.
            const blogPost = await this.blogPostModel.findById(blogPostId);
            if (!blogPost) {
                throw new NotFoundException(`Blog Post with ID ${blogPostId} not found.`);
            }

            // 2. Delete the comment document from the main 'comments' collection.
            // We check the result to make sure a comment was actually deleted.
            const deletedComment = await this.commentModel.findByIdAndDelete(commentId);
            if (!deletedComment) {
                throw new NotFoundException(`Comment with ID ${commentId} not found.`);
            }

            // removing the deleted commentid reference
            blogPost.comments = blogPost.comments.filter(
                (c: Types.ObjectId) => c.toString() !== commentId
            );


            const updatedPost = await blogPost.save();


            return updatedPost.populate('comments');

        } catch (error) {

            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error;
            }
            throw new BadRequestException(error.message);
        }
    }




}
