# Scope Definition Template Examples

This document provides comprehensive examples of how to use the new scope definition template functionality for services in the MSSP Client Management Platform.

## Overview

The scope definition template allows administrators to define dynamic form structures for service scope configuration. When a service is added to a contract, the frontend will use this template to generate appropriate form fields.

## API Endpoints

### 1. Create Service with Scope Definition Template

**POST** `/services`

```json
{
  "name": "Managed EDR",
  "description": "Comprehensive endpoint detection and response service",
  "category": "ENDPOINT_SECURITY",
  "deliveryModel": "MANAGED_SERVICE",
  "basePrice": 50.00,
  "isActive": true,
  "scopeDefinitionTemplate": {
    "fields": [
      {
        "name": "edr_platform",
        "label": "EDR Platform",
        "type": "select",
        "options": ["CarbonBlack", "Metras", "Rakeen"],
        "required": true,
        "description": "Select the EDR platform to be used."
      },
      {
        "name": "endpoint_count",
        "label": "Endpoint Count",
        "type": "number",
        "required": true,
        "min": 1,
        "max": 10000,
        "placeholder": "Enter number of endpoints"
      },
      {
        "name": "log_retention_days",
        "label": "Log Retention (days)",
        "type": "number",
        "required": false,
        "default": 30,
        "min": 7,
        "max": 365
      },
      {
        "name": "24x7_monitoring",
        "label": "24x7 Monitoring",
        "type": "boolean",
        "required": true,
        "default": true,
        "description": "Enable round-the-clock monitoring"
      },
      {
        "name": "custom_rules",
        "label": "Custom Detection Rules",
        "type": "textarea",
        "required": false,
        "maxLength": 1000,
        "placeholder": "Describe any custom detection rules needed"
      }
    ],
    "version": "1.0",
    "description": "Template for Managed EDR service scope configuration"
  }
}
```

### 2. Get Scope Definition Template

**GET** `/services/{serviceId}/scope-template`

Response:
```json
{
  "statusCode": 200,
  "message": "Scope definition template retrieved successfully",
  "data": {
    "scopeDefinitionTemplate": {
      "fields": [
        {
          "name": "edr_platform",
          "label": "EDR Platform",
          "type": "select",
          "options": ["CarbonBlack", "Metras", "Rakeen"],
          "required": true,
          "description": "Select the EDR platform to be used."
        }
        // ... other fields
      ],
      "version": "1.0",
      "description": "Template for Managed EDR service scope configuration"
    }
  }
}
```

### 3. Update Scope Definition Template

**PUT** `/services/{serviceId}/scope-template`

```json
{
  "scopeDefinitionTemplate": {
    "fields": [
      {
        "name": "edr_platform",
        "label": "EDR Platform",
        "type": "select",
        "options": ["CarbonBlack", "Metras", "Rakeen", "SentinelOne"],
        "required": true,
        "description": "Select the EDR platform to be used."
      },
      {
        "name": "endpoint_count",
        "label": "Endpoint Count",
        "type": "number",
        "required": true,
        "min": 1,
        "max": 10000,
        "placeholder": "Enter number of endpoints"
      },
      {
        "name": "threat_hunting",
        "label": "Threat Hunting Service",
        "type": "boolean",
        "required": false,
        "default": false,
        "description": "Include proactive threat hunting services"
      }
    ],
    "version": "1.1",
    "description": "Updated template for Managed EDR service scope configuration"
  }
}
```

## Real-World Service Examples

### 1. SIEM Monitoring Service

```json
{
  "name": "SIEM Monitoring",
  "category": "SECURITY_MONITORING",
  "deliveryModel": "MANAGED_SERVICE",
  "scopeDefinitionTemplate": {
    "fields": [
      {
        "name": "siem_platform",
        "label": "SIEM Platform",
        "type": "select",
        "options": ["Splunk", "QRadar", "ArcSight", "LogRhythm"],
        "required": true
      },
      {
        "name": "log_sources_count",
        "label": "Number of Log Sources",
        "type": "number",
        "required": true,
        "min": 1,
        "max": 1000
      },
      {
        "name": "daily_log_volume_gb",
        "label": "Daily Log Volume (GB)",
        "type": "number",
        "required": true,
        "min": 1,
        "max": 10000
      },
      {
        "name": "compliance_requirements",
        "label": "Compliance Requirements",
        "type": "select",
        "options": ["PCI-DSS", "ISO 27001", "NIST", "SOX", "HIPAA"],
        "required": false
      },
      {
        "name": "custom_dashboards",
        "label": "Custom Dashboards Required",
        "type": "boolean",
        "required": false,
        "default": false
      }
    ],
    "version": "1.0"
  }
}
```

### 2. Vulnerability Assessment Service

```json
{
  "name": "Vulnerability Assessment",
  "category": "VULNERABILITY_MANAGEMENT",
  "deliveryModel": "PROJECT_BASED",
  "scopeDefinitionTemplate": {
    "fields": [
      {
        "name": "assessment_type",
        "label": "Assessment Type",
        "type": "select",
        "options": ["Internal", "External", "Web Application", "Wireless", "Social Engineering"],
        "required": true
      },
      {
        "name": "target_count",
        "label": "Number of Targets",
        "type": "number",
        "required": true,
        "min": 1,
        "max": 1000
      },
      {
        "name": "assessment_frequency",
        "label": "Assessment Frequency",
        "type": "select",
        "options": ["One-time", "Quarterly", "Semi-annually", "Annually"],
        "required": true
      },
      {
        "name": "report_format",
        "label": "Report Format",
        "type": "select",
        "options": ["Executive Summary", "Technical Report", "Both"],
        "required": true,
        "default": "Both"
      },
      {
        "name": "remediation_support",
        "label": "Remediation Support Required",
        "type": "boolean",
        "required": false,
        "default": false
      },
      {
        "name": "special_requirements",
        "label": "Special Requirements",
        "type": "textarea",
        "required": false,
        "maxLength": 500,
        "placeholder": "Any special requirements or constraints"
      }
    ],
    "version": "1.0"
  }
}
```

### 3. Security Awareness Training

```json
{
  "name": "Security Awareness Training",
  "category": "TRAINING_AND_AWARENESS",
  "deliveryModel": "HYBRID",
  "scopeDefinitionTemplate": {
    "fields": [
      {
        "name": "participant_count",
        "label": "Number of Participants",
        "type": "number",
        "required": true,
        "min": 1,
        "max": 10000
      },
      {
        "name": "delivery_method",
        "label": "Delivery Method",
        "type": "select",
        "options": ["Online", "In-person", "Hybrid"],
        "required": true
      },
      {
        "name": "training_modules",
        "label": "Training Modules",
        "type": "select",
        "options": ["Phishing Awareness", "Password Security", "Social Engineering", "Data Protection", "Incident Response"],
        "required": true
      },
      {
        "name": "language",
        "label": "Training Language",
        "type": "select",
        "options": ["English", "Arabic", "Both"],
        "required": true,
        "default": "English"
      },
      {
        "name": "certification_required",
        "label": "Certification Required",
        "type": "boolean",
        "required": false,
        "default": false
      },
      {
        "name": "training_duration_hours",
        "label": "Training Duration (Hours)",
        "type": "number",
        "required": true,
        "min": 1,
        "max": 40,
        "default": 8
      }
    ],
    "version": "1.0"
  }
}
```

## Field Types and Validation

### Supported Field Types

1. **string** - Text input
2. **number** - Numeric input with optional min/max
3. **boolean** - Checkbox/toggle
4. **select** - Dropdown with predefined options
5. **textarea** - Multi-line text input
6. **date** - Date picker
7. **email** - Email input with validation
8. **url** - URL input with validation

### Validation Properties

- `required`: boolean - Whether the field is mandatory
- `min`/`max`: number - For numeric fields
- `minLength`/`maxLength`: number - For text fields
- `options`: string[] - For select fields
- `default`: any - Default value
- `placeholder`: string - Placeholder text
- `description`: string - Help text

## Frontend Integration

When the frontend receives a scope definition template, it can dynamically generate form fields:

```typescript
// Example React component logic
const generateFormField = (field: ScopeDefinitionField) => {
  switch (field.type) {
    case 'select':
      return (
        <Select
          label={field.label}
          options={field.options}
          required={field.required}
          description={field.description}
        />
      );
    case 'number':
      return (
        <NumberInput
          label={field.label}
          min={field.min}
          max={field.max}
          required={field.required}
          placeholder={field.placeholder}
        />
      );
    case 'boolean':
      return (
        <Checkbox
          label={field.label}
          defaultChecked={field.default}
          description={field.description}
        />
      );
    // ... other field types
  }
};
```

## Benefits

1. **Dynamic Configuration**: Administrators can define service scope structures without code changes
2. **Consistent UI**: Frontend automatically generates appropriate form fields
3. **Validation**: Built-in validation rules ensure data quality
4. **Flexibility**: Easy to modify service scope requirements
5. **Scalability**: New services can be added with custom scope definitions
6. **User Experience**: Intuitive forms guide users through service configuration

## Migration Path

Existing services without scope definition templates will continue to work normally. The `scopeDefinitionTemplate` field is nullable, so:

1. Services without templates will have `scopeDefinitionTemplate: null`
2. Frontend can fall back to a generic scope configuration form
3. Administrators can gradually add templates to existing services
4. New services can be created with templates from the start 