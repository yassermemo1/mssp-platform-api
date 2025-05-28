import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDynamicCustomFieldsSupport1748453000000 implements MigrationInterface {
    name = 'AddDynamicCustomFieldsSupport1748453000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create Custom Field Entity Type Enum
        await queryRunner.query(`CREATE TYPE "public"."custom_field_entity_type_enum" AS ENUM('client', 'contract', 'proposal', 'service_scope', 'service', 'user', 'hardware_asset', 'financial_transaction', 'license_pool', 'team_assignment')`);
        
        // Create Custom Field Type Enum
        await queryRunner.query(`CREATE TYPE "public"."custom_field_type_enum" AS ENUM('text_single_line', 'text_multi_line', 'text_rich', 'number_integer', 'number_decimal', 'date', 'datetime', 'time', 'boolean', 'select_single_dropdown', 'select_multi_checkbox', 'email', 'phone', 'url', 'user_reference', 'client_reference', 'file_upload', 'image_upload', 'json_data', 'currency', 'percentage')`);
        
        // Create Custom Field Definitions Table
        await queryRunner.query(`CREATE TABLE "custom_field_definitions" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "entityType" "public"."custom_field_entity_type_enum" NOT NULL,
            "name" character varying(100) NOT NULL,
            "label" character varying(200) NOT NULL,
            "fieldType" "public"."custom_field_type_enum" NOT NULL,
            "selectOptions" jsonb,
            "isRequired" boolean NOT NULL DEFAULT false,
            "displayOrder" integer NOT NULL DEFAULT 0,
            "placeholderText" character varying(255),
            "helpText" text,
            "validationRules" jsonb,
            "defaultValue" jsonb,
            "isActive" boolean NOT NULL DEFAULT true,
            "createdAt" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone,
            "updatedAt" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone,
            CONSTRAINT "PK_custom_field_definitions" PRIMARY KEY ("id")
        )`);
        
        // Create Custom Field Values Table (EAV approach - alternative to JSONB)
        await queryRunner.query(`CREATE TABLE "custom_field_values" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "fieldDefinitionId" uuid NOT NULL,
            "entityType" "public"."custom_field_entity_type_enum" NOT NULL,
            "entityId" uuid NOT NULL,
            "stringValue" text,
            "integerValue" bigint,
            "decimalValue" numeric(15,4),
            "booleanValue" boolean,
            "dateValue" timestamp,
            "jsonValue" jsonb,
            "createdAt" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone,
            "updatedAt" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone,
            CONSTRAINT "PK_custom_field_values" PRIMARY KEY ("id")
        )`);
        
        // Add customFieldData JSONB columns to target entities
        // Note: clients table already has this column, so we skip it
        await queryRunner.query(`ALTER TABLE "contracts" ADD "customFieldData" jsonb`);
        await queryRunner.query(`ALTER TABLE "proposals" ADD "customFieldData" jsonb`);
        await queryRunner.query(`ALTER TABLE "service_scopes" ADD "customFieldData" jsonb`);
        await queryRunner.query(`ALTER TABLE "services" ADD "customFieldData" jsonb`);
        await queryRunner.query(`ALTER TABLE "users" ADD "customFieldData" jsonb`);
        
        // Create indexes for custom field definitions
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_custom_field_definitions_entity_name" ON "custom_field_definitions" ("entityType", "name")`);
        await queryRunner.query(`CREATE INDEX "IDX_custom_field_definitions_entity_type" ON "custom_field_definitions" ("entityType")`);
        await queryRunner.query(`CREATE INDEX "IDX_custom_field_definitions_display_order" ON "custom_field_definitions" ("entityType", "displayOrder")`);
        await queryRunner.query(`CREATE INDEX "IDX_custom_field_definitions_active" ON "custom_field_definitions" ("entityType", "isActive")`);
        
        // Create indexes for custom field values
        await queryRunner.query(`CREATE INDEX "IDX_custom_field_values_entity" ON "custom_field_values" ("entityType", "entityId")`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_custom_field_values_unique" ON "custom_field_values" ("fieldDefinitionId", "entityId")`);
        await queryRunner.query(`CREATE INDEX "IDX_custom_field_values_field_definition" ON "custom_field_values" ("fieldDefinitionId")`);
        
        // Add foreign key constraints
        await queryRunner.query(`ALTER TABLE "custom_field_values" ADD CONSTRAINT "FK_custom_field_values_definition" FOREIGN KEY ("fieldDefinitionId") REFERENCES "custom_field_definitions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign key constraints
        await queryRunner.query(`ALTER TABLE "custom_field_values" DROP CONSTRAINT "FK_custom_field_values_definition"`);
        
        // Drop indexes
        await queryRunner.query(`DROP INDEX "public"."IDX_custom_field_values_field_definition"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_custom_field_values_unique"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_custom_field_values_entity"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_custom_field_definitions_active"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_custom_field_definitions_display_order"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_custom_field_definitions_entity_type"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_custom_field_definitions_entity_name"`);
        
        // Remove customFieldData columns from target entities
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "customFieldData"`);
        await queryRunner.query(`ALTER TABLE "services" DROP COLUMN "customFieldData"`);
        await queryRunner.query(`ALTER TABLE "service_scopes" DROP COLUMN "customFieldData"`);
        await queryRunner.query(`ALTER TABLE "proposals" DROP COLUMN "customFieldData"`);
        await queryRunner.query(`ALTER TABLE "contracts" DROP COLUMN "customFieldData"`);
        // Note: We don't drop from clients as it was already there
        
        // Drop tables
        await queryRunner.query(`DROP TABLE "custom_field_values"`);
        await queryRunner.query(`DROP TABLE "custom_field_definitions"`);
        
        // Drop enums
        await queryRunner.query(`DROP TYPE "public"."custom_field_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."custom_field_entity_type_enum"`);
    }
} 