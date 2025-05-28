import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index
} from 'typeorm';
import { HttpMethod, ExpectedResponseType } from '../../../enums';
import { ExternalDataSource } from './external-data-source.entity';

/**
 * DataSourceQuery Entity
 * Stores specific query configurations for external data sources
 * Supports templating with placeholders and JSONPath extraction
 */
@Entity('data_source_queries')
@Index(['queryName'], { unique: true })
@Index(['dataSourceId'])
@Index(['isActive'])
export class DataSourceQuery {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  queryName: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  /**
   * The endpoint path to call, can contain placeholders like {clientId}
   * Example: /api/v2/search or /rest/api/2/issue/{issueKey}
   */
  @Column({ type: 'varchar', length: 500 })
  endpointPath: string;

  @Column({
    type: 'enum',
    enum: HttpMethod
  })
  httpMethod: HttpMethod;

  /**
   * Query or body template based on httpMethod
   * For GET: URL query parameters (e.g., "status=Open&priority={priority}")
   * For POST: Request body template as JSON
   * Supports placeholders that will be replaced with context variables
   */
  @Column({ type: 'text', nullable: true })
  queryTemplate: string | null;

  /**
   * JSONPath expression to extract data from the response
   * Examples:
   * - $.total (gets the 'total' field from root)
   * - $.issues[*].key (gets all issue keys from an array)
   * - $.data.metrics.count (navigates nested objects)
   */
  @Column({ type: 'varchar', length: 500 })
  responseExtractionPath: string;

  @Column({
    type: 'enum',
    enum: ExpectedResponseType
  })
  expectedResponseType: ExpectedResponseType;

  /**
   * Cache Time-To-Live in seconds
   * 0 or null means no caching
   */
  @Column({ type: 'integer', nullable: true, default: 0 })
  cacheTTLSeconds: number | null;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @Column({ type: 'uuid' })
  dataSourceId: string;

  @ManyToOne(() => ExternalDataSource, (dataSource) => dataSource.queries, {
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'dataSourceId' })
  dataSource: ExternalDataSource;
} 