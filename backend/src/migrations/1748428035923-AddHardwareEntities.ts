import { MigrationInterface, QueryRunner } from "typeorm";

export class AddHardwareEntities1748428035923 implements MigrationInterface {
    name = 'AddHardwareEntities1748428035923'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."hardware_assets_assettype_enum" AS ENUM('server', 'workstation', 'laptop', 'desktop', 'network_device', 'firewall', 'switch', 'router', 'access_point', 'storage_device', 'security_appliance', 'monitoring_device', 'printer', 'mobile_device', 'tablet', 'other')`);
        await queryRunner.query(`CREATE TYPE "public"."hardware_assets_status_enum" AS ENUM('in_stock', 'awaiting_deployment', 'in_use', 'under_maintenance', 'awaiting_repair', 'retired', 'disposed', 'lost', 'stolen')`);
        await queryRunner.query(`CREATE TABLE "hardware_assets" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "assetTag" character varying(100) NOT NULL, "serialNumber" character varying(255), "deviceName" character varying(255), "manufacturer" character varying(100), "model" character varying(100), "assetType" "public"."hardware_assets_assettype_enum" NOT NULL, "status" "public"."hardware_assets_status_enum" NOT NULL DEFAULT 'in_stock', "purchaseDate" date, "purchaseCost" numeric(12,2), "warrantyExpiryDate" date, "location" character varying(255), "notes" text, "createdAt" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "updatedAt" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, CONSTRAINT "UQ_d4170158f6531e85568616c515c" UNIQUE ("assetTag"), CONSTRAINT "UQ_9e9b98c06379268abc825ee54b4" UNIQUE ("serialNumber"), CONSTRAINT "PK_bbd664d413f6ac099ebfc1ea40e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_3c5958f5361ec3d4c4c2666545" ON "hardware_assets" ("location") `);
        await queryRunner.query(`CREATE INDEX "IDX_e5c148ac48329f9d27464b037a" ON "hardware_assets" ("status") `);
        await queryRunner.query(`CREATE INDEX "IDX_578136f5dbfe6519c9efbb2087" ON "hardware_assets" ("assetType") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_ae964a119313aa9d55a681af2f" ON "hardware_assets" ("serialNumber") WHERE "serialNumber" IS NOT NULL`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_d4170158f6531e85568616c515" ON "hardware_assets" ("assetTag") `);
        await queryRunner.query(`CREATE TYPE "public"."client_hardware_assignments_status_enum" AS ENUM('active', 'returned', 'replaced', 'lost', 'damaged', 'cancelled')`);
        await queryRunner.query(`CREATE TABLE "client_hardware_assignments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "assignmentDate" date NOT NULL, "status" "public"."client_hardware_assignments_status_enum" NOT NULL DEFAULT 'active', "returnDate" date, "notes" text, "hardwareAssetId" uuid NOT NULL, "clientId" uuid NOT NULL, "serviceScopeId" uuid, "createdAt" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "updatedAt" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, CONSTRAINT "PK_dea5237d56dafcb2cfcc0a83168" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_c37d07fdf0c8d9710d6607ce87" ON "client_hardware_assignments" ("returnDate") `);
        await queryRunner.query(`CREATE INDEX "IDX_bef9ea579707f6a3ffb5c428d6" ON "client_hardware_assignments" ("assignmentDate") `);
        await queryRunner.query(`CREATE INDEX "IDX_32d6e263a6f9e419b3277ffa3a" ON "client_hardware_assignments" ("status") `);
        await queryRunner.query(`CREATE INDEX "IDX_f4a92e40905adaa957244100bd" ON "client_hardware_assignments" ("serviceScopeId") `);
        await queryRunner.query(`CREATE INDEX "IDX_04b579bf7fb38c8b6b3a37d7dd" ON "client_hardware_assignments" ("clientId") `);
        await queryRunner.query(`CREATE INDEX "IDX_a28843c2b7ee63db9a45496f06" ON "client_hardware_assignments" ("hardwareAssetId") `);
        await queryRunner.query(`ALTER TABLE "client_hardware_assignments" ADD CONSTRAINT "FK_a28843c2b7ee63db9a45496f06d" FOREIGN KEY ("hardwareAssetId") REFERENCES "hardware_assets"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "client_hardware_assignments" ADD CONSTRAINT "FK_04b579bf7fb38c8b6b3a37d7dd5" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "client_hardware_assignments" ADD CONSTRAINT "FK_f4a92e40905adaa957244100bd6" FOREIGN KEY ("serviceScopeId") REFERENCES "service_scopes"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "client_hardware_assignments" DROP CONSTRAINT "FK_f4a92e40905adaa957244100bd6"`);
        await queryRunner.query(`ALTER TABLE "client_hardware_assignments" DROP CONSTRAINT "FK_04b579bf7fb38c8b6b3a37d7dd5"`);
        await queryRunner.query(`ALTER TABLE "client_hardware_assignments" DROP CONSTRAINT "FK_a28843c2b7ee63db9a45496f06d"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a28843c2b7ee63db9a45496f06"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_04b579bf7fb38c8b6b3a37d7dd"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f4a92e40905adaa957244100bd"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_32d6e263a6f9e419b3277ffa3a"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_bef9ea579707f6a3ffb5c428d6"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c37d07fdf0c8d9710d6607ce87"`);
        await queryRunner.query(`DROP TABLE "client_hardware_assignments"`);
        await queryRunner.query(`DROP TYPE "public"."client_hardware_assignments_status_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d4170158f6531e85568616c515"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ae964a119313aa9d55a681af2f"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_578136f5dbfe6519c9efbb2087"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e5c148ac48329f9d27464b037a"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3c5958f5361ec3d4c4c2666545"`);
        await queryRunner.query(`DROP TABLE "hardware_assets"`);
        await queryRunner.query(`DROP TYPE "public"."hardware_assets_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."hardware_assets_assettype_enum"`);
    }

}
