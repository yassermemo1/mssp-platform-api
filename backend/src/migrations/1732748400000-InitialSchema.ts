import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1732748400000 implements MigrationInterface {
  name = 'InitialSchema1732748400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create user_role enum
    await queryRunner.query(`
      CREATE TYPE "user_role_enum" AS ENUM(
        'admin', 
        'manager', 
        'project_manager', 
        'account_manager', 
        'engineer'
      )
    `);

    // Create client_status enum
    await queryRunner.query(`
      CREATE TYPE "client_status_enum" AS ENUM(
        'prospect', 
        'active', 
        'inactive', 
        'expired', 
        'renewed'
      )
    `);

    // Create users table
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "firstName" character varying(100) NOT NULL,
        "lastName" character varying(100) NOT NULL,
        "email" character varying(255) NOT NULL,
        "password" character varying(255) NOT NULL,
        "role" "user_role_enum" NOT NULL,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        CONSTRAINT "PK_users_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_users_email" UNIQUE ("email")
      )
    `);

    // Create index on users email
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_users_email" ON "users" ("email")
    `);

    // Create clients table
    await queryRunner.query(`
      CREATE TABLE "clients" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "companyName" character varying(255) NOT NULL,
        "contactName" character varying(100) NOT NULL,
        "contactEmail" character varying(255) NOT NULL,
        "contactPhone" character varying(50),
        "address" text,
        "industry" character varying(100),
        "status" "client_status_enum" NOT NULL DEFAULT 'prospect',
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        CONSTRAINT "PK_clients_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_clients_companyName" UNIQUE ("companyName")
      )
    `);

    // Create index on clients companyName
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_clients_companyName" ON "clients" ("companyName")
    `);

    // Enable uuid-ossp extension if not already enabled
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables
    await queryRunner.query(`DROP TABLE "clients"`);
    await queryRunner.query(`DROP TABLE "users"`);
    
    // Drop enums
    await queryRunner.query(`DROP TYPE "client_status_enum"`);
    await queryRunner.query(`DROP TYPE "user_role_enum"`);
    
    // Drop indexes (they are dropped automatically with tables)
    // Drop extension (optional, might be used by other applications)
    // await queryRunner.query(`DROP EXTENSION "uuid-ossp"`);
  }
} 