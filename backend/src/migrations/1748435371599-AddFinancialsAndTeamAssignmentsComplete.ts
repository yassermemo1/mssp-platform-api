import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFinancialsAndTeamAssignmentsComplete1748435371599 implements MigrationInterface {
    name = 'AddFinancialsAndTeamAssignmentsComplete1748435371599'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."financial_transactions_type_enum" AS ENUM('REVENUE_CONTRACT_PAYMENT', 'REVENUE_LICENSE_SALE', 'REVENUE_HARDWARE_SALE', 'REVENUE_SERVICE_ONE_TIME', 'REVENUE_CONSULTATION', 'REVENUE_TRAINING', 'REVENUE_SUPPORT', 'COST_LICENSE_PURCHASE', 'COST_HARDWARE_PURCHASE', 'COST_OPERATIONAL', 'COST_PERSONNEL', 'COST_INFRASTRUCTURE', 'COST_VENDOR_SERVICES', 'COST_TRAINING', 'OTHER')`);
        await queryRunner.query(`CREATE TYPE "public"."financial_transactions_status_enum" AS ENUM('PENDING', 'PAID', 'PARTIALLY_PAID', 'OVERDUE', 'CANCELLED', 'REFUNDED', 'DISPUTED', 'PROCESSING', 'FAILED')`);
        await queryRunner.query(`CREATE TABLE "financial_transactions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" "public"."financial_transactions_type_enum" NOT NULL, "amount" numeric(15,2) NOT NULL, "currency" character varying(3) NOT NULL DEFAULT 'SAR', "transactionDate" date NOT NULL, "description" text NOT NULL, "status" "public"."financial_transactions_status_enum" NOT NULL DEFAULT 'PENDING', "referenceId" character varying(100), "notes" text, "dueDate" date, "clientId" uuid, "contractId" uuid, "serviceScopeId" uuid, "hardwareAssetId" uuid, "recordedByUserId" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "updatedAt" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, CONSTRAINT "PK_3f0ffe3ca2def8783ad8bb5036b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_b565160c5eb1de8804d4472c76" ON "financial_transactions" ("createdAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_9a83704d66a27e2f1b8927c3ca" ON "financial_transactions" ("recordedByUserId") `);
        await queryRunner.query(`CREATE INDEX "IDX_51a6383417b66390bd258a6d75" ON "financial_transactions" ("serviceScopeId") `);
        await queryRunner.query(`CREATE INDEX "IDX_492b9df05925148e5931e23354" ON "financial_transactions" ("contractId") `);
        await queryRunner.query(`CREATE INDEX "IDX_618a999927a9d15a66404736e8" ON "financial_transactions" ("clientId") `);
        await queryRunner.query(`CREATE INDEX "IDX_d5d229d47446fd13011db97f36" ON "financial_transactions" ("transactionDate") `);
        await queryRunner.query(`CREATE INDEX "IDX_5e1d060cfea925ab38f6edadbc" ON "financial_transactions" ("status") `);
        await queryRunner.query(`CREATE INDEX "IDX_deb2dfb473b2dc75b52d8960f0" ON "financial_transactions" ("type") `);
        await queryRunner.query(`CREATE TYPE "public"."client_team_assignments_assignmentrole_enum" AS ENUM('ACCOUNT_MANAGER', 'LEAD_ENGINEER', 'PROJECT_MANAGER', 'SUPPORT_CONTACT', 'SALES_LEAD', 'CONSULTANT', 'SECURITY_ANALYST', 'TECHNICAL_LEAD', 'IMPLEMENTATION_SPECIALIST', 'BACKUP_CONTACT')`);
        await queryRunner.query(`CREATE TABLE "client_team_assignments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "assignmentRole" "public"."client_team_assignments_assignmentrole_enum" NOT NULL, "assignmentDate" date DEFAULT ('now'::text)::date, "endDate" date, "isActive" boolean NOT NULL DEFAULT true, "notes" text, "priority" integer, "userId" uuid NOT NULL, "clientId" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "updatedAt" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, CONSTRAINT "UQ_user_client_role" UNIQUE ("userId", "clientId", "assignmentRole"), CONSTRAINT "PK_5fb0aed1e4fb6128b0a21dd3006" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_defa9080b16b34d9d894ea1800" ON "client_team_assignments" ("createdAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_5e9a64c56f98f3b2ea150ae4f6" ON "client_team_assignments" ("assignmentDate") `);
        await queryRunner.query(`CREATE INDEX "IDX_c382dbf5b7605490e6fac4d29b" ON "client_team_assignments" ("assignmentRole") `);
        await queryRunner.query(`CREATE INDEX "IDX_ee44d75d51bd324a0ad320fcb5" ON "client_team_assignments" ("clientId") `);
        await queryRunner.query(`CREATE INDEX "IDX_c78a11cb2fb6473397195716ab" ON "client_team_assignments" ("userId") `);
        await queryRunner.query(`ALTER TABLE "proposals" ADD "currency" character varying(3) DEFAULT 'SAR'`);
        await queryRunner.query(`ALTER TABLE "proposals" ADD "validUntilDate" date`);
        await queryRunner.query(`ALTER TABLE "proposals" ADD "assigneeUserId" uuid`);
        await queryRunner.query(`CREATE INDEX "IDX_77ce2d3af1067a7b50e012dbe4" ON "proposals" ("assigneeUserId") `);
        await queryRunner.query(`ALTER TABLE "proposals" ADD CONSTRAINT "FK_77ce2d3af1067a7b50e012dbe41" FOREIGN KEY ("assigneeUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "financial_transactions" ADD CONSTRAINT "FK_618a999927a9d15a66404736e8a" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "financial_transactions" ADD CONSTRAINT "FK_492b9df05925148e5931e233549" FOREIGN KEY ("contractId") REFERENCES "contracts"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "financial_transactions" ADD CONSTRAINT "FK_51a6383417b66390bd258a6d751" FOREIGN KEY ("serviceScopeId") REFERENCES "service_scopes"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "financial_transactions" ADD CONSTRAINT "FK_93333f3ce69ce32c624f4de5474" FOREIGN KEY ("hardwareAssetId") REFERENCES "hardware_assets"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "financial_transactions" ADD CONSTRAINT "FK_9a83704d66a27e2f1b8927c3caa" FOREIGN KEY ("recordedByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "client_team_assignments" ADD CONSTRAINT "FK_c78a11cb2fb6473397195716abd" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "client_team_assignments" ADD CONSTRAINT "FK_ee44d75d51bd324a0ad320fcb51" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "client_team_assignments" DROP CONSTRAINT "FK_ee44d75d51bd324a0ad320fcb51"`);
        await queryRunner.query(`ALTER TABLE "client_team_assignments" DROP CONSTRAINT "FK_c78a11cb2fb6473397195716abd"`);
        await queryRunner.query(`ALTER TABLE "financial_transactions" DROP CONSTRAINT "FK_9a83704d66a27e2f1b8927c3caa"`);
        await queryRunner.query(`ALTER TABLE "financial_transactions" DROP CONSTRAINT "FK_93333f3ce69ce32c624f4de5474"`);
        await queryRunner.query(`ALTER TABLE "financial_transactions" DROP CONSTRAINT "FK_51a6383417b66390bd258a6d751"`);
        await queryRunner.query(`ALTER TABLE "financial_transactions" DROP CONSTRAINT "FK_492b9df05925148e5931e233549"`);
        await queryRunner.query(`ALTER TABLE "financial_transactions" DROP CONSTRAINT "FK_618a999927a9d15a66404736e8a"`);
        await queryRunner.query(`ALTER TABLE "proposals" DROP CONSTRAINT "FK_77ce2d3af1067a7b50e012dbe41"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_77ce2d3af1067a7b50e012dbe4"`);
        await queryRunner.query(`ALTER TABLE "proposals" DROP COLUMN "assigneeUserId"`);
        await queryRunner.query(`ALTER TABLE "proposals" DROP COLUMN "validUntilDate"`);
        await queryRunner.query(`ALTER TABLE "proposals" DROP COLUMN "currency"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c78a11cb2fb6473397195716ab"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ee44d75d51bd324a0ad320fcb5"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c382dbf5b7605490e6fac4d29b"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5e9a64c56f98f3b2ea150ae4f6"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_defa9080b16b34d9d894ea1800"`);
        await queryRunner.query(`DROP TABLE "client_team_assignments"`);
        await queryRunner.query(`DROP TYPE "public"."client_team_assignments_assignmentrole_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_deb2dfb473b2dc75b52d8960f0"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5e1d060cfea925ab38f6edadbc"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d5d229d47446fd13011db97f36"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_618a999927a9d15a66404736e8"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_492b9df05925148e5931e23354"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_51a6383417b66390bd258a6d75"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9a83704d66a27e2f1b8927c3ca"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b565160c5eb1de8804d4472c76"`);
        await queryRunner.query(`DROP TABLE "financial_transactions"`);
        await queryRunner.query(`DROP TYPE "public"."financial_transactions_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."financial_transactions_type_enum"`);
    }

}
