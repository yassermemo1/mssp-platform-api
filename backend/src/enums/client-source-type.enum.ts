/**
 * Client Source Type Enumeration
 * Tracks how clients were acquired or the source of the client relationship
 * Supports various acquisition channels and marketing initiatives
 */
export enum ClientSourceType {
  // Direct acquisition
  DIRECT_SALES = 'direct_sales',
  
  // Referral sources
  REFERRAL = 'referral',
  PARTNER = 'partner',
  
  // Marketing campaigns
  MARKETING_CAMPAIGN_CLOUD = 'marketing_campaign_cloud',
  MARKETING_CAMPAIGN_DEEM = 'marketing_campaign_deem',
  
  // Government and regulatory initiatives
  NCA_INITIATIVE = 'nca_initiative',
  
  // Digital channels
  WEB_INQUIRY = 'web_inquiry',
  
  // Events and conferences
  EVENT = 'event',
  
  // Other/Miscellaneous
  OTHER = 'other',
} 