/**
 * SLA Metric Type Enum
 * Defines the types of SLA metrics that can be tracked
 */
export enum SLAMetricType {
  // Response time metrics
  INITIAL_RESPONSE_TIME = 'initial_response_time',
  RESOLUTION_TIME = 'resolution_time',
  
  // Availability metrics
  SYSTEM_UPTIME = 'system_uptime',
  SERVICE_AVAILABILITY = 'service_availability',
  
  // Performance metrics
  MEAN_TIME_TO_REPAIR = 'mean_time_to_repair',
  MEAN_TIME_BETWEEN_FAILURES = 'mean_time_between_failures',
  
  // Throughput metrics
  INCIDENTS_RESOLVED = 'incidents_resolved',
  TICKETS_PROCESSED = 'tickets_processed',
  
  // Quality metrics
  FIRST_CALL_RESOLUTION = 'first_call_resolution',
  CUSTOMER_SATISFACTION = 'customer_satisfaction',
  
  // Security metrics
  SECURITY_INCIDENT_RESPONSE = 'security_incident_response',
  PATCH_COMPLIANCE = 'patch_compliance',
  
  // Custom metrics
  CUSTOM = 'custom'
} 