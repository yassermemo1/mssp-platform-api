/**
 * External API Authentication Type Enum
 * Defines the authentication methods supported for external API integrations
 */
export enum ExternalApiAuthenticationType {
  NONE = 'NONE',
  BASIC_AUTH_USERNAME_PASSWORD = 'BASIC_AUTH_USERNAME_PASSWORD',
  BEARER_TOKEN_STATIC = 'BEARER_TOKEN_STATIC',
  API_KEY_IN_HEADER = 'API_KEY_IN_HEADER',
  API_KEY_IN_QUERY_PARAM = 'API_KEY_IN_QUERY_PARAM'
  // OAuth2 flows can be added as V2 enhancement
} 