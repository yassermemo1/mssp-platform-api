import { MigrationInterface, QueryRunner } from "typeorm";

export class AddComprehensiveServiceContractProposalSchema1748385786599 implements MigrationInterface {
    name = 'AddComprehensiveServiceContractProposalSchema1748385786599'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "contracts" DROP CONSTRAINT "FK_62a5163bebb9d95e503b01c0fb0"`);
        await queryRunner.query(`CREATE TYPE "public"."proposals_proposaltype_enum" AS ENUM('technical', 'financial', 'technical_financial', 'architecture', 'implementation', 'pricing', 'scope_change', 'other')`);
        await queryRunner.query(`CREATE TYPE "public"."proposals_status_enum" AS ENUM('draft', 'in_preparation', 'submitted', 'under_review', 'pending_approval', 'pending_client_review', 'requires_revision', 'approved', 'rejected', 'withdrawn', 'archived', 'accepted_by_client', 'in_implementation', 'completed')`);
        await queryRunner.query(`CREATE TABLE "proposals" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "proposalType" "public"."proposals_proposaltype_enum" NOT NULL, "documentLink" character varying(500) NOT NULL, "version" character varying(50), "status" "public"."proposals_status_enum" NOT NULL DEFAULT 'draft', "title" character varying(255), "description" text, "proposalValue" numeric(15,2), "estimatedDurationDays" integer, "submittedAt" TIMESTAMP, "approvedAt" TIMESTAMP, "notes" text, "serviceScopeId" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "updatedAt" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, CONSTRAINT "PK_db524c8db8e126a38a2f16d8cac" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_f340098e78d0016c92e4e029ad" ON "proposals" ("createdAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_09d2319018bf917d600ba742c5" ON "proposals" ("status") `);
        await queryRunner.query(`CREATE INDEX "IDX_b3591493741b4e66fae75a5c30" ON "proposals" ("proposalType") `);
        await queryRunner.query(`CREATE INDEX "IDX_41660552070bfa9792f95a504a" ON "proposals" ("serviceScopeId") `);
        await queryRunner.query(`CREATE TYPE "public"."services_deliverymodel_enum" AS ENUM('serverless', 'saas_platform', 'cloud_hosted', 'physical_servers', 'on_premises_engineer', 'client_infrastructure', 'remote_support', 'remote_monitoring', 'virtual_delivery', 'hybrid', 'multi_cloud', 'consulting_engagement', 'professional_services')`);
        await queryRunner.query(`ALTER TABLE "services" ADD "deliveryModel" "public"."services_deliverymodel_enum" NOT NULL`);
        await queryRunner.query(`ALTER TABLE "service_scopes" ADD "safDocumentLink" character varying(500)`);
        await queryRunner.query(`ALTER TABLE "service_scopes" ADD "safServiceStartDate" date`);
        await queryRunner.query(`ALTER TABLE "service_scopes" ADD "safServiceEndDate" date`);
        await queryRunner.query(`CREATE TYPE "public"."service_scopes_safstatus_enum" AS ENUM('not_initiated', 'draft', 'pending_client_signature', 'signed_by_client', 'client_review', 'activated', 'in_progress', 'completed', 'expired', 'cancelled', 'rejected')`);
        await queryRunner.query(`ALTER TABLE "service_scopes" ADD "safStatus" "public"."service_scopes_safstatus_enum" DEFAULT 'not_initiated'`);
        await queryRunner.query(`ALTER TABLE "contracts" ADD "previousContractId" uuid`);
        await queryRunner.query(`ALTER TYPE "public"."services_category_enum" RENAME TO "services_category_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."services_category_enum" AS ENUM('security_operations', 'endpoint_security', 'network_security', 'cloud_security', 'infrastructure_security', 'data_protection', 'privacy_compliance', 'incident_response', 'threat_hunting', 'forensics', 'compliance', 'risk_assessment', 'audit_services', 'consulting', 'security_architecture', 'strategy_planning', 'managed_it', 'managed_detection_response', 'managed_siem', 'training', 'security_awareness', 'penetration_testing', 'vulnerability_assessment', 'other')`);
        await queryRunner.query(`ALTER TABLE "services" ALTER COLUMN "category" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "services" ALTER COLUMN "category" TYPE "public"."services_category_enum" USING "category"::"text"::"public"."services_category_enum"`);
        await queryRunner.query(`DROP TYPE "public"."services_category_enum_old"`);
        await queryRunner.query(`ALTER TABLE "services" ALTER COLUMN "category" SET NOT NULL`);
        await queryRunner.query(`ALTER TYPE "public"."contracts_status_enum" RENAME TO "contracts_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."contracts_status_enum" AS ENUM('draft', 'pending_approval', 'active', 'renewed_active', 'renewed_inactive', 'expired', 'terminated', 'cancelled', 'suspended', 'on_hold')`);
        await queryRunner.query(`ALTER TABLE "contracts" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "contracts" ALTER COLUMN "status" TYPE "public"."contracts_status_enum" USING "status"::"text"::"public"."contracts_status_enum"`);
        await queryRunner.query(`ALTER TABLE "contracts" ALTER COLUMN "status" SET DEFAULT 'draft'`);
        await queryRunner.query(`DROP TYPE "public"."contracts_status_enum_old"`);
        await queryRunner.query(`CREATE INDEX "IDX_6d149e510fc4de20510200ed76" ON "services" ("isActive") `);
        await queryRunner.query(`CREATE INDEX "IDX_2d95747203df5b9ead2ebfe96d" ON "services" ("deliveryModel") `);
        await queryRunner.query(`CREATE INDEX "IDX_cfdcce31c9c571f9e5a8226dec" ON "services" ("category") `);
        await queryRunner.query(`CREATE INDEX "IDX_1d1eb93fde79549ff96561fa18" ON "service_scopes" ("isActive") `);
        await queryRunner.query(`CREATE INDEX "IDX_830d916a2ecb7c25e0bd098fb0" ON "service_scopes" ("safStatus") `);
        await queryRunner.query(`CREATE INDEX "IDX_8e7afb21b5e602947c04a7d85d" ON "contracts" ("previousContractId") `);
        await queryRunner.query(`CREATE INDEX "IDX_78fd0b9f9cbfc7869ca4d9f5e3" ON "contracts" ("status") `);
        await queryRunner.query(`ALTER TABLE "proposals" ADD CONSTRAINT "FK_41660552070bfa9792f95a504a7" FOREIGN KEY ("serviceScopeId") REFERENCES "service_scopes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "contracts" ADD CONSTRAINT "FK_62a5163bebb9d95e503b01c0fb0" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "contracts" ADD CONSTRAINT "FK_8e7afb21b5e602947c04a7d85d1" FOREIGN KEY ("previousContractId") REFERENCES "contracts"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "contracts" DROP CONSTRAINT "FK_8e7afb21b5e602947c04a7d85d1"`);
        await queryRunner.query(`ALTER TABLE "contracts" DROP CONSTRAINT "FK_62a5163bebb9d95e503b01c0fb0"`);
        await queryRunner.query(`ALTER TABLE "proposals" DROP CONSTRAINT "FK_41660552070bfa9792f95a504a7"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_78fd0b9f9cbfc7869ca4d9f5e3"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8e7afb21b5e602947c04a7d85d"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_830d916a2ecb7c25e0bd098fb0"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_1d1eb93fde79549ff96561fa18"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_cfdcce31c9c571f9e5a8226dec"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_2d95747203df5b9ead2ebfe96d"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_6d149e510fc4de20510200ed76"`);
        await queryRunner.query(`CREATE TYPE "public"."contracts_status_enum_old" AS ENUM('draft', 'active', 'expired', 'terminated', 'renewed', 'suspended')`);
        await queryRunner.query(`ALTER TABLE "contracts" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "contracts" ALTER COLUMN "status" TYPE "public"."contracts_status_enum_old" USING "status"::"text"::"public"."contracts_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "contracts" ALTER COLUMN "status" SET DEFAULT 'draft'`);
        await queryRunner.query(`DROP TYPE "public"."contracts_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."contracts_status_enum_old" RENAME TO "contracts_status_enum"`);
        await queryRunner.query(`ALTER TABLE "services" ALTER COLUMN "category" DROP NOT NULL`);
        await queryRunner.query(`CREATE TYPE "public"."services_category_enum_old" AS ENUM('security_operations', 'consulting', 'compliance', 'incident_response', 'vulnerability_management', 'threat_intelligence', 'managed_services', 'training', 'assessment', 'other')`);
        await queryRunner.query(`ALTER TABLE "services" ALTER COLUMN "category" TYPE "public"."services_category_enum_old" USING "category"::"text"::"public"."services_category_enum_old"`);
        await queryRunner.query(`ALTER TABLE "services" ALTER COLUMN "category" SET DEFAULT 'other'`);
        await queryRunner.query(`DROP TYPE "public"."services_category_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."services_category_enum_old" RENAME TO "services_category_enum"`);
        await queryRunner.query(`ALTER TABLE "contracts" DROP COLUMN "previousContractId"`);
        await queryRunner.query(`ALTER TABLE "service_scopes" DROP COLUMN "safStatus"`);
        await queryRunner.query(`DROP TYPE "public"."service_scopes_safstatus_enum"`);
        await queryRunner.query(`ALTER TABLE "service_scopes" DROP COLUMN "safServiceEndDate"`);
        await queryRunner.query(`ALTER TABLE "service_scopes" DROP COLUMN "safServiceStartDate"`);
        await queryRunner.query(`ALTER TABLE "service_scopes" DROP COLUMN "safDocumentLink"`);
        await queryRunner.query(`ALTER TABLE "services" DROP COLUMN "deliveryModel"`);
        await queryRunner.query(`DROP TYPE "public"."services_deliverymodel_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_41660552070bfa9792f95a504a"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b3591493741b4e66fae75a5c30"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_09d2319018bf917d600ba742c5"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f340098e78d0016c92e4e029ad"`);
        await queryRunner.query(`DROP TABLE "proposals"`);
        await queryRunner.query(`DROP TYPE "public"."proposals_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."proposals_proposaltype_enum"`);
        await queryRunner.query(`ALTER TABLE "contracts" ADD CONSTRAINT "FK_62a5163bebb9d95e503b01c0fb0" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
