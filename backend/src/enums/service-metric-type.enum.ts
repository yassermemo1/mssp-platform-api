/**
 * Service Metric Type Enum
 * Defines the types of service performance metrics that can be tracked
 */
export enum ServiceMetricType {
  // EDR (Endpoint Detection & Response) metrics
  EDR_ENDPOINTS_ACTIVE = 'edr_endpoints_active',
  EDR_THREATS_DETECTED = 'edr_threats_detected',
  EDR_THREATS_RESOLVED = 'edr_threats_resolved',
  
  // SIEM (Security Information & Event Management) metrics
  SIEM_EVENTS_PROCESSED = 'siem_events_processed',
  SIEM_ALERTS_GENERATED = 'siem_alerts_generated',
  SIEM_LOG_VOLUME_GB = 'siem_log_volume_gb',
  
  // NDR (Network Detection & Response) metrics
  NDR_TRAFFIC_ANALYZED_GB = 'ndr_traffic_analyzed_gb',
  NDR_ANOMALIES_DETECTED = 'ndr_anomalies_detected',
  NDR_NETWORK_THREATS = 'ndr_network_threats',
  
  // General service metrics
  SERVICE_UTILIZATION = 'service_utilization',
  SERVICE_CAPACITY = 'service_capacity',
  SERVICE_PERFORMANCE_SCORE = 'service_performance_score',
  
  // Custom metrics
  CUSTOM = 'custom'
} 