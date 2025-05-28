/**
 * Hardware Asset Status Enumeration
 * Defines the different lifecycle states of hardware assets
 */
export enum HardwareAssetStatus {
  IN_STOCK = 'in_stock',
  AWAITING_DEPLOYMENT = 'awaiting_deployment',
  IN_USE = 'in_use',
  UNDER_MAINTENANCE = 'under_maintenance',
  AWAITING_REPAIR = 'awaiting_repair',
  RETIRED = 'retired',
  DISPOSED = 'disposed',
  LOST = 'lost',
  STOLEN = 'stolen',
} 