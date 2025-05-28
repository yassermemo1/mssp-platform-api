import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { CustomFieldEntityType } from '../enums';
import { CustomFieldDefinition } from './custom-field-definition.entity';

/**
 * Custom Field Value Entity (EAV Pattern)
 * Stores actual values for custom fields for specific entity instances
 * Alternative to JSONB approach - provides more structured storage but requires joins
 */
@Entity('custom_field_values')
@Index(['entityType', 'entityId'])
@Index(['fieldDefinitionId', 'entityId'], { unique: true })
export class CustomFieldValue {
  /**
   * Primary key using UUID for scalability and security
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Reference to the custom field definition
   */
  @Column({ type: 'uuid', nullable: false })
  fieldDefinitionId: string;

  /**
   * Entity type that this value belongs to
   * Used for polymorphic relationships
   */
  @Column({
    type: 'enum',
    enum: CustomFieldEntityType,
    nullable: false,
  })
  @Index()
  entityType: CustomFieldEntityType;

  /**
   * ID of the target entity instance (e.g., specific Client ID)
   */
  @Column({ type: 'uuid', nullable: false })
  @Index()
  entityId: string;

  /**
   * String value for text-based fields
   */
  @Column({ type: 'text', nullable: true })
  stringValue: string | null;

  /**
   * Numeric value for integer fields
   */
  @Column({ type: 'bigint', nullable: true })
  integerValue: number | null;

  /**
   * Numeric value for decimal fields
   */
  @Column({ type: 'decimal', precision: 15, scale: 4, nullable: true })
  decimalValue: number | null;

  /**
   * Boolean value for boolean fields
   */
  @Column({ type: 'boolean', nullable: true })
  booleanValue: boolean | null;

  /**
   * Date value for date/datetime fields
   */
  @Column({ type: 'timestamp', nullable: true })
  dateValue: Date | null;

  /**
   * JSON value for complex data types (arrays, objects, etc.)
   */
  @Column({ type: 'jsonb', nullable: true })
  jsonValue: any | null;

  /**
   * Timestamp when the value was created
   */
  @CreateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
  })
  createdAt: Date;

  /**
   * Timestamp when the value was last updated
   */
  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
    onUpdate: 'CURRENT_TIMESTAMP(6)',
  })
  updatedAt: Date;

  /**
   * Many-to-one relationship with CustomFieldDefinition
   */
  @ManyToOne(() => CustomFieldDefinition, (definition) => definition.values, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'fieldDefinitionId' })
  fieldDefinition: CustomFieldDefinition;

  /**
   * Get the appropriate value based on the field type
   */
  getValue(): any {
    if (this.stringValue !== null) return this.stringValue;
    if (this.integerValue !== null) return this.integerValue;
    if (this.decimalValue !== null) return this.decimalValue;
    if (this.booleanValue !== null) return this.booleanValue;
    if (this.dateValue !== null) return this.dateValue;
    if (this.jsonValue !== null) return this.jsonValue;
    return null;
  }

  /**
   * Set the appropriate value based on the field type
   */
  setValue(value: any, fieldType: string): void {
    // Reset all values
    this.stringValue = null;
    this.integerValue = null;
    this.decimalValue = null;
    this.booleanValue = null;
    this.dateValue = null;
    this.jsonValue = null;

    if (value === null || value === undefined) {
      return;
    }

    switch (fieldType) {
      case 'text_single_line':
      case 'text_multi_line':
      case 'email':
      case 'phone':
      case 'url':
        this.stringValue = String(value);
        break;
      case 'number_integer':
        this.integerValue = parseInt(value, 10);
        break;
      case 'number_decimal':
      case 'currency':
      case 'percentage':
        this.decimalValue = parseFloat(value);
        break;
      case 'boolean':
        this.booleanValue = Boolean(value);
        break;
      case 'date':
      case 'datetime':
      case 'time':
        this.dateValue = new Date(value);
        break;
      default:
        this.jsonValue = value;
        break;
    }
  }
} 