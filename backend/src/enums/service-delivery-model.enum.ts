/**
 * Service Delivery Model Enumeration
 * Defines how MSSP services are delivered to clients
 * Supports various deployment and delivery methodologies
 */
export enum ServiceDeliveryModel {
  // Cloud-based delivery
  SERVERLESS = 'serverless',
  SAAS_PLATFORM = 'saas_platform',
  CLOUD_HOSTED = 'cloud_hosted',
  
  // On-premises delivery
  PHYSICAL_SERVERS = 'physical_servers',
  ON_PREMISES_ENGINEER = 'on_premises_engineer',
  CLIENT_INFRASTRUCTURE = 'client_infrastructure',
  
  // Remote delivery
  REMOTE_SUPPORT = 'remote_support',
  REMOTE_MONITORING = 'remote_monitoring',
  VIRTUAL_DELIVERY = 'virtual_delivery',
  
  // Hybrid approaches
  HYBRID = 'hybrid',
  MULTI_CLOUD = 'multi_cloud',
  
  // Consulting/Advisory
  CONSULTING_ENGAGEMENT = 'consulting_engagement',
  PROFESSIONAL_SERVICES = 'professional_services',
} 