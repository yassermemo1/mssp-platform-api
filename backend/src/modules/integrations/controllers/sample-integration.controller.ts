import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { SampleApiService } from '../services/sample-api.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../../enums/user-role.enum';
import { firstValueFrom } from 'rxjs';

/**
 * SampleIntegrationController
 * Demonstrates how to expose external API integrations through our platform
 * All endpoints require authentication
 */
@Controller('integrations/sample')
@UseGuards(JwtAuthGuard)
export class SampleIntegrationController {
  private readonly logger = new Logger(SampleIntegrationController.name);

  constructor(private readonly sampleApiService: SampleApiService) {}

  /**
   * Get posts from the sample API
   * GET /integrations/sample/posts
   * Requires: Any authenticated user
   */
  @Get('posts')
  @HttpCode(HttpStatus.OK)
  async getPosts(@Query('limit') limit?: string) {
    this.logger.log(`Fetching posts from sample API with limit: ${limit}`);
    
    const posts = await firstValueFrom(
      this.sampleApiService.getPosts(limit ? parseInt(limit, 10) : undefined)
    );
    
    return {
      statusCode: HttpStatus.OK,
      message: 'Posts retrieved successfully',
      data: posts,
      meta: {
        count: posts.length,
        source: 'JSONPlaceholder API',
      },
    };
  }

  /**
   * Get a single post by ID
   * GET /integrations/sample/posts/:id
   * Requires: Any authenticated user
   */
  @Get('posts/:id')
  @HttpCode(HttpStatus.OK)
  async getPost(@Param('id') id: string) {
    this.logger.log(`Fetching post ${id} from sample API`);
    
    const post = await firstValueFrom(
      this.sampleApiService.getPost(parseInt(id, 10))
    );
    
    return {
      statusCode: HttpStatus.OK,
      message: 'Post retrieved successfully',
      data: post,
    };
  }

  /**
   * Get users from the sample API
   * GET /integrations/sample/users
   * Requires: ADMIN or MANAGER role
   */
  @Get('users')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @HttpCode(HttpStatus.OK)
  async getUsers() {
    this.logger.log('Fetching users from sample API');
    
    const users = await firstValueFrom(this.sampleApiService.getUsers());
    
    return {
      statusCode: HttpStatus.OK,
      message: 'Users retrieved successfully',
      data: users,
      meta: {
        count: users.length,
      },
    };
  }

  /**
   * Get user with their posts
   * GET /integrations/sample/users/:id/with-posts
   * Requires: Any authenticated user
   */
  @Get('users/:id/with-posts')
  @HttpCode(HttpStatus.OK)
  async getUserWithPosts(@Param('id') id: string) {
    this.logger.log(`Fetching user ${id} with posts from sample API`);
    
    const result = await firstValueFrom(
      this.sampleApiService.getUserWithPosts(parseInt(id, 10))
    );
    
    return {
      statusCode: HttpStatus.OK,
      message: 'User with posts retrieved successfully',
      data: result,
    };
  }

  /**
   * Create a new post (simulated)
   * POST /integrations/sample/posts
   * Requires: ADMIN role
   */
  @Post('posts')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async createPost(@Body() postData: { userId: number; title: string; body: string }) {
    this.logger.log('Creating post via sample API');
    
    const post = await firstValueFrom(
      this.sampleApiService.createPost(postData)
    );
    
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Post created successfully (simulated)',
      data: post,
    };
  }

  /**
   * Update a post (simulated)
   * PUT /integrations/sample/posts/:id
   * Requires: ADMIN role
   */
  @Put('posts/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async updatePost(
    @Param('id') id: string,
    @Body() updates: { title?: string; body?: string }
  ) {
    this.logger.log(`Updating post ${id} via sample API`);
    
    const post = await firstValueFrom(
      this.sampleApiService.updatePost(parseInt(id, 10), updates)
    );
    
    return {
      statusCode: HttpStatus.OK,
      message: 'Post updated successfully (simulated)',
      data: post,
    };
  }

  /**
   * Delete a post (simulated)
   * DELETE /integrations/sample/posts/:id
   * Requires: ADMIN role
   */
  @Delete('posts/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePost(@Param('id') id: string) {
    this.logger.log(`Deleting post ${id} via sample API`);
    
    await firstValueFrom(
      this.sampleApiService.deletePost(parseInt(id, 10))
    );
  }

  /**
   * Health check for the sample API integration
   * GET /integrations/sample/health
   * Requires: Any authenticated user
   */
  @Get('health')
  @HttpCode(HttpStatus.OK)
  async checkHealth() {
    this.logger.log('Checking sample API health');
    
    try {
      // Try to fetch one post as a health check
      await firstValueFrom(this.sampleApiService.getPost(1));
      
      return {
        statusCode: HttpStatus.OK,
        message: 'Sample API integration is healthy',
        data: {
          status: 'operational',
          integration: 'JSONPlaceholder',
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      return {
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
        message: 'Sample API integration is unhealthy',
        data: {
          status: 'error',
          integration: 'JSONPlaceholder',
          error: error.message,
          timestamp: new Date().toISOString(),
        },
      };
    }
  }
} 