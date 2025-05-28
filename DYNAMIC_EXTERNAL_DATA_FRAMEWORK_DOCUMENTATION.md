# Dynamic External Data Source Management & Querying Framework

## Overview

The Dynamic External Data Source Management & Querying Framework is a comprehensive backend solution for the MSSP Client Management Platform that enables administrators to configure and query various external REST APIs dynamically. This framework provides a secure, extensible, and robust mechanism for integrating with third-party services like Jira DC, Grafana, EDRs, and custom APIs.

## Key Features

1. **Dynamic Configuration**: Administrators can define external data sources without code changes
2. **Multiple Authentication Types**: Supports various authentication mechanisms (Basic Auth, Bearer Token, API Keys)
3. **Secure Credential Storage**: Uses AES-256-GCM encryption for sensitive credentials
4. **Template-Based Queries**: Supports placeholder replacement for dynamic queries
5. **JSONPath Data Extraction**: Extract specific data from complex JSON responses
6. **Response Caching**: Built-in caching mechanism for performance optimization
7. **Type Coercion**: Automatic type conversion based on expected response types

## Architecture Components

### 1. Entities

#### ExternalDataSource
Stores configuration and authentication details for external REST APIs:
- **id**: UUID primary key
- **name**: Unique name for the data source
- **systemType**: Type of external system (JIRA_DC, GRAFANA, etc.)
- **baseUrl**: Base URL of the external API
- **authenticationType**: Authentication method used
- **credentialsEncrypted**: Encrypted credentials storage
- **defaultHeaders**: Default headers for all requests
- **isActive**: Enable/disable flag

#### DataSourceQuery
Stores specific query configurations:
- **id**: UUID primary key
- **queryName**: Unique name for the query
- **endpointPath**: API endpoint path with placeholders
- **httpMethod**: HTTP method (GET, POST)
- **queryTemplate**: Query parameters or request body template
- **responseExtractionPath**: JSONPath expression for data extraction
- **expectedResponseType**: Expected data type of extracted value
- **cacheTTLSeconds**: Cache time-to-live
- **dataSourceId**: Reference to parent data source

### 2. Services

#### EncryptionService
- Handles AES-256-GCM encryption/decryption
- Uses environment variable ENCRYPTION_KEY
- Provides methods for encrypting/decrypting objects

#### DynamicDataFetcherService
Core service that:
- Fetches data from configured external sources
- Handles authentication dynamically
- Performs placeholder replacement
- Executes HTTP requests
- Extracts data using JSONPath
- Manages caching
- Provides type coercion

#### ExternalDataSourceService & DataSourceQueryService
CRUD services for managing configurations with:
- Validation logic
- Duplicate prevention
- Secure credential handling
- Relationship management

### 3. Controllers

#### IntegrationsAdminController (Admin Only)
- Full CRUD for ExternalDataSource
- Full CRUD for DataSourceQuery
- Connection testing
- Template validation

#### IntegrationsDataController (Operational)
- Fetch data using configured queries
- Support for both GET and POST methods
- Context variable processing

## Usage Examples

### 1. Configure a Jira DC Data Source

```bash
POST /integrations/admin/data-sources
{
  "name": "Jira DC Production",
  "systemType": "JIRA_DC",
  "baseUrl": "https://jira.company.com",
  "authenticationType": "BASIC_AUTH_USERNAME_PASSWORD",
  "credentials": {
    "username": "api_user",
    "password": "secure_password"
  },
  "defaultHeaders": {
    "Accept": "application/json"
  },
  "description": "Production Jira Data Center instance"
}
```

### 2. Create a Query for Open Critical Tickets

```bash
POST /integrations/admin/queries
{
  "queryName": "getClientOpenCriticalJiraTickets",
  "description": "Get open critical tickets for a specific client",
  "dataSourceId": "<jira-datasource-id>",
  "endpointPath": "/rest/api/2/search",
  "httpMethod": "GET",
  "queryTemplate": "jql=project={projectKey} AND status='Open' AND priority='Critical'&fields=key,summary,status,priority",
  "responseExtractionPath": "$.total",
  "expectedResponseType": "NUMBER",
  "cacheTTLSeconds": 300
}
```

### 3. Fetch Data Using the Query

```bash
GET /integrations/data/getClientOpenCriticalJiraTickets?projectKey=CLIENT1
# or
POST /integrations/data/getClientOpenCriticalJiraTickets
{
  "contextVariables": {
    "projectKey": "CLIENT1"
  }
}
```

## Security Considerations

1. **Encryption Key Management**:
   - Set `ENCRYPTION_KEY` environment variable
   - Use a strong, randomly generated key
   - Consider using dedicated secret management in production

2. **Role-Based Access Control**:
   - Admin endpoints require ADMIN role
   - Data fetching requires MANAGER or ACCOUNT_MANAGER role

3. **Credential Security**:
   - Credentials are encrypted before storage
   - Never exposed in API responses
   - Decrypted only during request execution

## Supported Authentication Types

1. **NONE**: No authentication required
2. **BASIC_AUTH_USERNAME_PASSWORD**: Basic HTTP authentication
3. **BEARER_TOKEN_STATIC**: Static bearer token
4. **API_KEY_IN_HEADER**: API key in custom header
5. **API_KEY_IN_QUERY_PARAM**: API key as query parameter

## JSONPath Examples

- `$.total` - Get 'total' field from root
- `$.issues[*].key` - Get all issue keys from array
- `$.data.metrics.count` - Navigate nested objects
- `$.items[?(@.status=='active')].name` - Filter active items

## Migration Process

1. Generate migration: `npm run migration:generate src/migrations/AddExternalDataSourceEntities`
2. Run migration: `npm run migration:run`
3. Rollback if needed: `npm run migration:revert`

## Integration with Phase 5.5

In the next phase (Chunk 5.5), this framework will be used to:
1. Configure Jira DC as an external data source
2. Create queries for various Jira metrics (tickets, SLAs, etc.)
3. Integrate the fetched data into existing dashboards
4. Provide real-time Jira data to the frontend components

## Error Handling

The framework provides comprehensive error handling for:
- Missing or inactive data sources/queries
- Authentication failures
- Network timeouts
- Invalid JSONPath expressions
- Type coercion failures
- Missing context variables

## Performance Optimization

1. **Caching**: Configure `cacheTTLSeconds` for frequently accessed data
2. **Connection Pooling**: HTTP client reuses connections
3. **Timeout Configuration**: 30-second default timeout prevents hanging requests
4. **Index Optimization**: Database indexes on frequently queried fields

## Future Enhancements

1. OAuth2 authentication support
2. Webhook support for real-time updates
3. Batch query execution
4. Advanced retry mechanisms
5. GraphQL support
6. Response transformation pipelines

## Environment Variables

Required:
- `ENCRYPTION_KEY`: Secret key for credential encryption

Optional:
- `INTEGRATION_TIMEOUT`: HTTP request timeout (default: 30000ms)
- `INTEGRATION_MAX_REDIRECTS`: Maximum redirects (default: 5)

## Testing Recommendations

1. Unit tests for encryption/decryption
2. Integration tests for CRUD operations
3. Mock external APIs for query execution tests
4. Load testing for caching effectiveness
5. Security testing for credential handling 