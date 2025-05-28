import { MigrationInterface, QueryRunner } from "typeorm";

export class AddJiraProjectKeyToClient1748452750320 implements MigrationInterface {
    name = 'AddJiraProjectKeyToClient1748452750320'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."data_source_queries_httpmethod_enum" AS ENUM('GET', 'POST')`);
        await queryRunner.query(`CREATE TYPE "public"."data_source_queries_expectedresponsetype_enum" AS ENUM('NUMBER', 'STRING', 'BOOLEAN', 'JSON_OBJECT', 'JSON_ARRAY')`);
        await queryRunner.query(`CREATE TABLE "data_source_queries" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "queryName" character varying(255) NOT NULL, "description" text, "endpointPath" character varying(500) NOT NULL, "httpMethod" "public"."data_source_queries_httpmethod_enum" NOT NULL, "queryTemplate" text, "responseExtractionPath" character varying(500) NOT NULL, "expectedResponseType" "public"."data_source_queries_expectedresponsetype_enum" NOT NULL, "cacheTTLSeconds" integer DEFAULT '0', "isActive" boolean NOT NULL DEFAULT true, "notes" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "dataSourceId" uuid NOT NULL, CONSTRAINT "UQ_0f28ea3157553ff66c734f3d3c8" UNIQUE ("queryName"), CONSTRAINT "PK_adf0d5e94a46b9719b365ee2c11" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_3c952667395ed473a3e78ef739" ON "data_source_queries" ("isActive") `);
        await queryRunner.query(`CREATE INDEX "IDX_1b2b37b3222d78cf84ebe2dafa" ON "data_source_queries" ("dataSourceId") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_0f28ea3157553ff66c734f3d3c" ON "data_source_queries" ("queryName") `);
        await queryRunner.query(`CREATE TYPE "public"."external_data_sources_systemtype_enum" AS ENUM('JIRA_DC', 'GRAFANA', 'GENERIC_REST_API', 'EDR_VENDOR_X', 'CUSTOM_API')`);
        await queryRunner.query(`CREATE TYPE "public"."external_data_sources_authenticationtype_enum" AS ENUM('NONE', 'BASIC_AUTH_USERNAME_PASSWORD', 'BEARER_TOKEN_STATIC', 'API_KEY_IN_HEADER', 'API_KEY_IN_QUERY_PARAM')`);
        await queryRunner.query(`CREATE TABLE "external_data_sources" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(255) NOT NULL, "systemType" "public"."external_data_sources_systemtype_enum" NOT NULL, "baseUrl" character varying(500) NOT NULL, "authenticationType" "public"."external_data_sources_authenticationtype_enum" NOT NULL, "credentialsEncrypted" text, "defaultHeaders" jsonb, "description" text, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_2b551ea3814e92cef70bb02f1bd" UNIQUE ("name"), CONSTRAINT "PK_8e5c3ae3b53b1072fadd2d83376" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_6d3c1fc285b16df3974e3a4980" ON "external_data_sources" ("isActive") `);
        await queryRunner.query(`CREATE INDEX "IDX_a5866fba621f384e46953297da" ON "external_data_sources" ("systemType") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_2b551ea3814e92cef70bb02f1b" ON "external_data_sources" ("name") `);
        await queryRunner.query(`ALTER TABLE "clients" ADD "jiraProjectKey" character varying(50)`);
        await queryRunner.query(`ALTER TABLE "data_source_queries" ADD CONSTRAINT "FK_1b2b37b3222d78cf84ebe2dafa5" FOREIGN KEY ("dataSourceId") REFERENCES "external_data_sources"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "data_source_queries" DROP CONSTRAINT "FK_1b2b37b3222d78cf84ebe2dafa5"`);
        await queryRunner.query(`ALTER TABLE "clients" DROP COLUMN "jiraProjectKey"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_2b551ea3814e92cef70bb02f1b"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a5866fba621f384e46953297da"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_6d3c1fc285b16df3974e3a4980"`);
        await queryRunner.query(`DROP TABLE "external_data_sources"`);
        await queryRunner.query(`DROP TYPE "public"."external_data_sources_authenticationtype_enum"`);
        await queryRunner.query(`DROP TYPE "public"."external_data_sources_systemtype_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0f28ea3157553ff66c734f3d3c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_1b2b37b3222d78cf84ebe2dafa"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3c952667395ed473a3e78ef739"`);
        await queryRunner.query(`DROP TABLE "data_source_queries"`);
        await queryRunner.query(`DROP TYPE "public"."data_source_queries_expectedresponsetype_enum"`);
        await queryRunner.query(`DROP TYPE "public"."data_source_queries_httpmethod_enum"`);
    }

}
