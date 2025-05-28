import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Query
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../../enums';
import { DynamicDataFetcherService } from '../services/dynamic-data-fetcher.service';
import { FetchDataDto } from '../dto/fetch-data.dto';

/**
 * IntegrationsDataController
 * Provides operational endpoints for fetching data from configured external sources
 * Accessible to users who can view dashboards
 */
@Controller('integrations/data')
@UseGuards(JwtAuthGuard, RolesGuard)
export class IntegrationsDataController {
  constructor(
    private readonly dataFetcherService: DynamicDataFetcherService
  ) {}

  /**
   * Fetch data using a configured query (POST method for complex context variables)
   */
  @Post(':queryName')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.ACCOUNT_MANAGER)
  async fetchDataPost(
    @Param('queryName') queryName: string,
    @Body() dto: FetchDataDto
  ) {
    return await this.dataFetcherService.fetchData(queryName, dto.contextVariables);
  }

  /**
   * Fetch data using a configured query (GET method for simple context variables)
   */
  @Get(':queryName')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.ACCOUNT_MANAGER)
  async fetchDataGet(
    @Param('queryName') queryName: string,
    @Query() contextVariables: Record<string, any>
  ) {
    // Convert query string values to appropriate types
    const processedVariables = this.processQueryVariables(contextVariables);
    return await this.dataFetcherService.fetchData(queryName, processedVariables);
  }

  /**
   * Process query string variables to handle common type conversions
   */
  private processQueryVariables(variables: Record<string, any>): Record<string, any> {
    const processed: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(variables)) {
      // Handle boolean values
      if (value === 'true') {
        processed[key] = true;
      } else if (value === 'false') {
        processed[key] = false;
      }
      // Handle numeric values
      else if (!isNaN(Number(value)) && value !== '') {
        processed[key] = Number(value);
      }
      // Keep as string
      else {
        processed[key] = value;
      }
    }
    
    return processed;
  }
} 