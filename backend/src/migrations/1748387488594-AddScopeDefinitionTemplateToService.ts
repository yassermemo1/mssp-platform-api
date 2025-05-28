import { MigrationInterface, QueryRunner } from "typeorm";

export class AddScopeDefinitionTemplateToService1748387488594 implements MigrationInterface {
    name = 'AddScopeDefinitionTemplateToService1748387488594'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "services" ADD "scopeDefinitionTemplate" jsonb`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "services" DROP COLUMN "scopeDefinitionTemplate"`);
    }

}
