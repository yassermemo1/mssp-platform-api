# JWT Authentication & Role-Based Access Control Implementation

## Overview

This document describes the complete implementation of JWT authentication and role-based access control (RBAC) for the MSSP Client Management Platform backend. The implementation provides secure authentication and fine-grained authorization based on user roles.

## Architecture Components

### 1. JWT Strategy (`JwtStrategy`)
**File:** `src/modules/auth/strategies/jwt.strategy.ts`

- Extends `PassportStrategy(Strategy, 'jwt')`
- Extracts JWT from Authorization header as Bearer token
- Validates token signature and expiration using `JWT_SECRET`
- Returns authenticated user object with essential information

**Key Features:**
- Automatic token validation
- Payload structure validation
- Role enum validation
- Returns `AuthenticatedUser` object attached to `request.user`

### 2. JWT Authentication Guard (`JwtAuthGuard`)
**File:** `src/modules/auth/guards/jwt-auth.guard.ts`

- Extends `AuthGuard('jwt')` from Passport
- Protects routes by requiring valid JWT tokens
- Supports `@Public()` decorator for opt-out authentication
- Provides detailed error messages for different failure scenarios

**Error Handling:**
- `TokenExpiredError` → "Token has expired"
- `JsonWebTokenError` → "Invalid token"
- `NotBeforeError` → "Token not active yet"
- Missing token → "Authorization token is required"

### 3. Roles Decorator (`@Roles`)
**File:** `src/modules/auth/decorators/roles.decorator.ts`

- Custom decorator using `SetMetadata`
- Specifies required roles for route access
- Supports multiple roles (user needs at least one)
- Used in conjunction with `RolesGuard`

**Usage Examples:**
```typescript
@Roles(UserRole.ADMIN)                                    // Admin only
@Roles(UserRole.ADMIN, UserRole.MANAGER)                 // Admin or Manager
@Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.PROJECT_MANAGER) // Multiple roles
```

### 4. Roles Guard (`RolesGuard`)
**File:** `src/modules/auth/guards/roles.guard.ts`

- Implements role-based access control
- Uses `Reflector` to read role metadata from routes
- Compares user's role against required roles
- Works in conjunction with `JwtAuthGuard`

**Security Design:**
- If no `@Roles` decorator: Access allowed (authentication already verified)
- If `@Roles` decorator present: User must have at least one required role
- Missing user info: 403 Forbidden
- Insufficient permissions: 403 Forbidden with detailed message

### 5. Public Decorator (`@Public`)
**File:** `src/modules/auth/decorators/public.decorator.ts`

- Marks routes as public (bypasses authentication)
- Useful for login, register, health checks
- Works with modified `JwtAuthGuard`

## Implementation Details

### Module Integration

The `AuthModule` provides all authentication components:

```typescript
@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({...}),
  ],
  controllers: [
    AuthController,    // Authentication endpoints
    ProfileController, // JWT auth demonstration
    UsersController,   // RBAC demonstration
  ],
  providers: [
    AuthService,
    JwtStrategy,
    JwtAuthGuard,
    RolesGuard,
  ],
  exports: [
    AuthService,
    JwtModule,
    JwtAuthGuard,
    RolesGuard,
    JwtStrategy,
  ],
})
```

### Guard Application Patterns

#### Individual Route Protection
```typescript
@UseGuards(JwtAuthGuard)
@Get('me')
async getProfile(@Request() req) {
  return req.user; // AuthenticatedUser object
}
```

#### Controller-Level Protection
```typescript
@Controller('profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  // All routes require authentication
}
```

#### Role-Based Protection
```typescript
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  
  @Roles(UserRole.ADMIN)
  @Get('stats')
  async getStats() {
    // Admin only
  }
  
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Get('all')
  async getAllUsers() {
    // Admin or Manager
  }
}
```

## Example Controllers

### ProfileController
Demonstrates basic JWT authentication:
- `GET /profile/me` - Returns authenticated user's profile
- `GET /profile/settings` - Returns user settings

### UsersController
Demonstrates role-based access control:
- `GET /users/all` - Admin or Manager only
- `GET /users/stats` - Admin only
- `GET /users/team` - Admin, Manager, or Project Manager

## Testing Results

### Authentication Tests
✅ **Public endpoints work without tokens**
- `GET /` → 200 OK
- `GET /config/server` → 200 OK
- `POST /auth/login` → 200 OK
- `POST /auth/register` → 201 Created

✅ **Protected endpoints require authentication**
- `GET /profile/me` without token → 401 Unauthorized
- `GET /profile/me` with valid token → 200 OK

### Authorization Tests
✅ **Role-based access control works correctly**
- Admin accessing admin-only endpoint → 200 OK
- Engineer accessing admin-only endpoint → 403 Forbidden
- Admin accessing multi-role endpoint → 200 OK
- Engineer accessing multi-role endpoint → 403 Forbidden

### Error Messages
✅ **Detailed error responses**
- No token: "Authorization token is required"
- Invalid token: "Invalid token"
- Expired token: "Token has expired"
- Insufficient role: "Access denied. Required roles: admin. User role: engineer"

## Security Features

1. **JWT Token Validation**
   - Signature verification using `JWT_SECRET`
   - Expiration checking
   - Payload structure validation

2. **Role-Based Access Control**
   - Fine-grained permissions based on user roles
   - Support for multiple role requirements
   - Clear error messages for debugging

3. **Secure Defaults**
   - Authentication required by default (with opt-out)
   - Detailed error logging
   - No sensitive information in error responses

4. **Flexible Architecture**
   - Easy to apply to new controllers/routes
   - Supports both method and class-level decorators
   - Extensible for additional security features

## User Roles

The system supports the following roles (defined in `UserRole` enum):
- `ADMIN` - Full system access
- `MANAGER` - Management-level access
- `PROJECT_MANAGER` - Project management access
- `ACCOUNT_MANAGER` - Account management access
- `ENGINEER` - Basic user access

## Next Steps

1. **Global Guard Application** - Apply `JwtAuthGuard` globally via `APP_GUARD`
2. **Permission System** - Extend RBAC with granular permissions
3. **Rate Limiting** - Add rate limiting to authentication endpoints
4. **Audit Logging** - Log authentication and authorization events
5. **Token Refresh** - Implement refresh token mechanism

## Conclusion

The JWT authentication and RBAC system is fully functional and provides:
- Secure token-based authentication
- Flexible role-based authorization
- Clear error handling and debugging
- Easy integration with existing and new endpoints
- Comprehensive testing coverage

The implementation follows NestJS best practices and provides a solid foundation for the MSSP Client Management Platform's security requirements. 