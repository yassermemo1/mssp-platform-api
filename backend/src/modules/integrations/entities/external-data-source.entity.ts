import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index
} from 'typeorm';
import { ExternalSystemType, ExternalApiAuthenticationType } from '../../../enums';
import { DataSourceQuery } from './data-source-query.entity';

/**
 * ExternalDataSource Entity
 * Stores configuration and authentication details for external REST APIs
 * Credentials are stored encrypted for security
 */
@Entity('external_data_sources')
@Index(['name'], { unique: true })
@Index(['systemType'])
@Index(['isActive'])
export class ExternalDataSource {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  name: string;

  @Column({
    type: 'enum',
    enum: ExternalSystemType
  })
  systemType: ExternalSystemType;

  @Column({ type: 'varchar', length: 500 })
  baseUrl: string;

  @Column({
    type: 'enum',
    enum: ExternalApiAuthenticationType
  })
  authenticationType: ExternalApiAuthenticationType;

  /**
   * Stores encrypted JSON credentials based on authenticationType
   * Examples:
   * - Basic Auth: {"username": "user", "password": "pass"}
   * - Bearer Token: {"token": "bearer-token"}
   * - API Key in Header: {"headerName": "X-API-Key", "keyValue": "api-key"}
   * - API Key in Query: {"paramName": "apiKey", "keyValue": "api-key"}
   */
  @Column({ type: 'text', nullable: true })
  credentialsEncrypted: string | null;

  /**
   * Default headers to include in all requests to this data source
   * Stored as JSON object
   */
  @Column({ type: 'jsonb', nullable: true })
  defaultHeaders: Record<string, string> | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @OneToMany(() => DataSourceQuery, (query) => query.dataSource)
  queries: DataSourceQuery[];
} 