import { MigrationInterface, QueryRunner } from "typeorm";

export class AddJiraProjectKeyToClient1748452750320 implements MigrationInterface {
    name = 'AddJiraProjectKeyToClient1748452750320'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Check if jiraProjectKey column exists before adding it
        const hasColumn = await queryRunner.hasColumn("clients", "jiraProjectKey");
        if (!hasColumn) {
            await queryRunner.query(`ALTER TABLE "clients" ADD "jiraProjectKey" character varying(50)`);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const hasColumn = await queryRunner.hasColumn("clients", "jiraProjectKey");
        if (hasColumn) {
            await queryRunner.query(`ALTER TABLE "clients" DROP COLUMN "jiraProjectKey"`);
        }
    }
}
