import { MigrationInterface, QueryRunner } from "typeorm";

export class AddClientSourceField1748386353957 implements MigrationInterface {
    name = 'AddClientSourceField1748386353957'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."clients_clientsource_enum" AS ENUM('direct_sales', 'referral', 'partner', 'marketing_campaign_cloud', 'marketing_campaign_deem', 'nca_initiative', 'web_inquiry', 'event', 'other')`);
        await queryRunner.query(`ALTER TABLE "clients" ADD "clientSource" "public"."clients_clientsource_enum"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "clients" DROP COLUMN "clientSource"`);
        await queryRunner.query(`DROP TYPE "public"."clients_clientsource_enum"`);
    }

}
