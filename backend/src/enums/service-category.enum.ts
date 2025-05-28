/**
 * Service Category Enumeration
 * Comprehensive list of MSSP service categories for proper classification
 * Supports current and future service offerings
 */
export enum ServiceCategory {
  // Core Security Operations
  SECURITY_OPERATIONS = 'security_operations',
  ENDPOINT_SECURITY = 'endpoint_security',
  NETWORK_SECURITY = 'network_security',
  
  // Cloud & Infrastructure
  CLOUD_SECURITY = 'cloud_security',
  INFRASTRUCTURE_SECURITY = 'infrastructure_security',
  
  // Data & Privacy
  DATA_PROTECTION = 'data_protection',
  PRIVACY_COMPLIANCE = 'privacy_compliance',
  
  // Incident & Response
  INCIDENT_RESPONSE = 'incident_response',
  THREAT_HUNTING = 'threat_hunting',
  FORENSICS = 'forensics',
  
  // Governance & Compliance
  COMPLIANCE = 'compliance',
  RISK_ASSESSMENT = 'risk_assessment',
  AUDIT_SERVICES = 'audit_services',
  
  // Consulting & Advisory
  CONSULTING = 'consulting',
  SECURITY_ARCHITECTURE = 'security_architecture',
  STRATEGY_PLANNING = 'strategy_planning',
  
  // Managed Services
  MANAGED_IT = 'managed_it',
  MANAGED_DETECTION_RESPONSE = 'managed_detection_response',
  MANAGED_SIEM = 'managed_siem',
  
  // Training & Awareness
  TRAINING = 'training',
  SECURITY_AWARENESS = 'security_awareness',
  
  // Testing & Assessment
  PENETRATION_TESTING = 'penetration_testing',
  VULNERABILITY_ASSESSMENT = 'vulnerability_assessment',
  
  // Other/Miscellaneous
  OTHER = 'other',
} 