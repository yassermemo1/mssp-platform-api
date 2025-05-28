import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { BaseIntegrationService } from './base-integration.service';
import { IntegrationConfigService } from './integration-config.service';

// Sample API response interfaces
interface JsonPlaceholderPost {
  userId: number;
  id: number;
  title: string;
  body: string;
}

interface JsonPlaceholderUser {
  id: number;
  name: string;
  username: string;
  email: string;
  address: {
    street: string;
    suite: string;
    city: string;
    zipcode: string;
  };
}

/**
 * SampleApiService
 * Example integration using JSONPlaceholder API
 * Demonstrates how to extend BaseIntegrationService for specific APIs
 */
@Injectable()
export class SampleApiService extends BaseIntegrationService {
  constructor(
    httpService: HttpService,
    private readonly integrationConfigService: IntegrationConfigService,
  ) {
    super(httpService, 'Sample');
    
    // Initialize with configuration
    // For demo purposes, we'll use JSONPlaceholder which doesn't require auth
    this.setConfig({
      baseUrl: 'https://jsonplaceholder.typicode.com',
      timeout: 10000,
      retryAttempts: 2,
    });
  }

  /**
   * Get all posts from the sample API
   * @param limit - Maximum number of posts to retrieve
   * @returns Observable of posts array
   */
  getPosts(limit?: number): Observable<JsonPlaceholderPost[]> {
    return this.get<JsonPlaceholderPost[]>('/posts').pipe(
      map(posts => limit ? posts.slice(0, limit) : posts),
    );
  }

  /**
   * Get a single post by ID
   * @param postId - ID of the post
   * @returns Observable of post object
   */
  getPost(postId: number): Observable<JsonPlaceholderPost> {
    return this.get<JsonPlaceholderPost>(`/posts/${postId}`);
  }

  /**
   * Get all users from the sample API
   * @returns Observable of users array
   */
  getUsers(): Observable<JsonPlaceholderUser[]> {
    return this.get<JsonPlaceholderUser[]>('/users');
  }

  /**
   * Get posts by a specific user
   * @param userId - ID of the user
   * @returns Observable of posts array
   */
  getPostsByUser(userId: number): Observable<JsonPlaceholderPost[]> {
    return this.get<JsonPlaceholderPost[]>('/posts', {
      params: { userId },
    });
  }

  /**
   * Create a new post (simulated - JSONPlaceholder doesn't persist)
   * @param post - Post data to create
   * @returns Observable of created post
   */
  createPost(post: Omit<JsonPlaceholderPost, 'id'>): Observable<JsonPlaceholderPost> {
    return this.post<JsonPlaceholderPost>('/posts', post);
  }

  /**
   * Update a post (simulated)
   * @param postId - ID of the post to update
   * @param updates - Partial post data to update
   * @returns Observable of updated post
   */
  updatePost(postId: number, updates: Partial<JsonPlaceholderPost>): Observable<JsonPlaceholderPost> {
    return this.put<JsonPlaceholderPost>(`/posts/${postId}`, updates);
  }

  /**
   * Delete a post (simulated)
   * @param postId - ID of the post to delete
   * @returns Observable of empty response
   */
  deletePost(postId: number): Observable<void> {
    return this.delete<void>(`/posts/${postId}`);
  }

  /**
   * Example of aggregating data from multiple endpoints
   * @param userId - ID of the user
   * @returns Observable of user with their posts
   */
  getUserWithPosts(userId: number): Observable<{
    user: JsonPlaceholderUser;
    posts: JsonPlaceholderPost[];
  }> {
    // In a real scenario, you might use RxJS operators like forkJoin
    // For simplicity, we'll make sequential calls
    return new Observable(subscriber => {
      let userData: JsonPlaceholderUser;
      
      this.get<JsonPlaceholderUser>(`/users/${userId}`).subscribe({
        next: (user) => {
          userData = user;
          this.getPostsByUser(userId).subscribe({
            next: (posts) => {
              subscriber.next({ user: userData, posts });
              subscriber.complete();
            },
            error: (err) => subscriber.error(err),
          });
        },
        error: (err) => subscriber.error(err),
      });
    });
  }
} 