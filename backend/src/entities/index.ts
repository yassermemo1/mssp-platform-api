/**
 * Entity exports
 * Central export point for all TypeORM entities
 */
export { User } from './user.entity';
export { Client } from './client.entity';
export { Service } from './service.entity';
export { Contract } from './contract.entity';
export { ServiceScope } from './service-scope.entity';
export { Proposal } from './proposal.entity';
export { HardwareAsset } from './hardware-asset.entity';
export { ClientHardwareAssignment } from './client-hardware-assignment.entity';
export { FinancialTransaction } from '../modules/financials/entities/financial-transaction.entity';
export { ClientTeamAssignment } from '../modules/team-assignments/entities/client-team-assignment.entity';
export { SLAMetric } from './sla-metric.entity';
export { TicketSummary } from './ticket-summary.entity';
export { ServicePerformanceMetric } from './service-performance-metric.entity';
export { ClientSubscriptionSnapshot } from './client-subscription-snapshot.entity';

// Custom Fields Entities
export { CustomFieldDefinition } from './custom-field-definition.entity';
export { CustomFieldValue } from './custom-field-value.entity';

// Integration Entities
export { ExternalDataSource } from '../modules/integrations/entities/external-data-source.entity';
export { DataSourceQuery } from '../modules/integrations/entities/data-source-query.entity'; 