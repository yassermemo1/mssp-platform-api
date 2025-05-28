import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomFieldDefinition, CustomFieldValue } from '../../entities';
import { CustomFieldDefinitionService } from './services/custom-field-definition.service';
import { CustomFieldValueService } from './services/custom-field-value.service';
import { CustomFieldValidationService } from './services/custom-field-validation.service';
import { CustomFieldDefinitionsAdminController } from './controllers/custom-field-definitions-admin.controller';

/**
 * Custom Fields Module
 * Handles dynamic custom field definitions and values
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      CustomFieldDefinition,
      CustomFieldValue,
    ]),
  ],
  controllers: [
    CustomFieldDefinitionsAdminController,
  ],
  providers: [
    CustomFieldDefinitionService,
    CustomFieldValueService,
    CustomFieldValidationService,
  ],
  exports: [
    CustomFieldDefinitionService,
    CustomFieldValueService,
    CustomFieldValidationService,
  ],
})
export class CustomFieldsModule {} 