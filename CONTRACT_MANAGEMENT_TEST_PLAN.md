# 📋 MSSP Platform Contract Management Workflow Test Plan

**Test Date**: Wednesday, May 28, 2025, 10:43 AM (Riyadh Time, +03)  
**Test Environment**: Development (localhost)  
**Backend**: NestJS on http://localhost:3001  
**Frontend**: React on http://localhost:3000  
**Test Scope**: End-to-End Contract Management Workflow

## 📊 Test Overview

**Test Categories**: 5 main categories with 45+ test cases  
**Coverage Areas**: Contract CRUD, Service Scopes, Dynamic Forms, Proposals, RBAC, File Uploads  
**User Roles Tested**: ADMIN, MANAGER, ACCOUNT_MANAGER, PROJECT_MANAGER, ENGINEER  

---

## 🎯 Test Environment Setup

### Prerequisites
- ✅ Backend server running on http://localhost:3001
- ✅ Frontend server running on http://localhost:3000
- ✅ PostgreSQL database with test data
- ✅ File upload directories configured
- ✅ Test users with different roles created

### Test Data Requirements
```json
{
  "test_clients": [
    {
      "name": "Pharma Inc.",
      "email": "contact@pharmainc.com",
      "status": "active"
    },
    {
      "name": "TechCorp Ltd.",
      "email": "admin@techcorp.com", 
      "status": "active"
    }
  ],
  "test_services": [
    {
      "name": "Managed SIEM",
      "category": "SECURITY_MONITORING",
      "scopeDefinitionTemplate": {
        "fields": [
          {
            "name": "log_sources",
            "label": "Log Sources",
            "type": "textarea",
            "required": true,
            "placeholder": "List log sources (one per line)"
          },
          {
            "name": "eps_target",
            "label": "EPS Target",
            "type": "number",
            "required": true,
            "min": 100,
            "max": 10000
          }
        ]
      }
    },
    {
      "name": "Managed EDR",
      "category": "ENDPOINT_SECURITY",
      "scopeDefinitionTemplate": {
        "fields": [
          {
            "name": "edr_platform",
            "label": "EDR Platform",
            "type": "select",
            "options": ["CarbonBlack", "Metras", "Rakeen"],
            "required": true
          },
          {
            "name": "endpoint_count",
            "label": "Endpoint Count",
            "type": "number",
            "required": true,
            "min": 1
          }
        ]
      }
    }
  ],
  "test_users": [
    {
      "email": "admin@mssp.com",
      "role": "admin",
      "permissions": "Full access"
    },
    {
      "email": "manager@mssp.com", 
      "role": "manager",
      "permissions": "Management access"
    },
    {
      "email": "account.manager@mssp.com",
      "role": "account_manager", 
      "permissions": "Account management"
    },
    {
      "email": "engineer@mssp.com",
      "role": "engineer",
      "permissions": "Read-only access"
    }
  ]
}
```

---

## 🧪 I. Core Contract Creation Workflow

### CM_TC_001: Successful Contract Creation (Admin Role)
**Objective**: Verify admin can create a new contract with all required fields  
**Preconditions**: 
- Admin user logged in
- Client "Pharma Inc." exists in system
- No existing contract with name "Pharma SIEM 2025"

**Test Steps**:
1. Navigate to Contracts section
2. Click "Create New Contract" button
3. Fill in contract details:
   - Contract Name: "Pharma SIEM 2025"
   - Client: Select "Pharma Inc." from dropdown
   - Start Date: "2025-06-01"
   - End Date: "2026-05-31"
   - Contract Value: "150000.00"
   - Status: "DRAFT"
   - Description: "Annual SIEM monitoring service"
4. Click "Create Contract" button

**Expected Result**:
- Contract created successfully with status 201
- Contract appears in contracts list
- All fields saved correctly in database
- Contract ID generated and displayed
- Success message shown to user
- Redirect to contract details page

### CM_TC_002: Contract Creation with Document Upload
**Objective**: Verify contract creation with main contract document upload  
**Preconditions**: Same as CM_TC_001 + PDF file ready for upload

**Test Steps**:
1. Follow steps 1-3 from CM_TC_001
2. In "Contract Document" section, click "Upload Document"
3. Select valid PDF file (< 10MB)
4. Verify file preview/name appears
5. Click "Create Contract" button

**Expected Result**:
- Contract created with document link populated
- Document uploaded to correct directory (/uploads/contracts/)
- Document accessible via generated URL
- File metadata stored correctly (filename, size, upload date)

### CM_TC_003: Contract Creation with Previous Contract Link
**Objective**: Verify contract renewal functionality  
**Preconditions**: 
- Admin user logged in
- Existing contract "Pharma SIEM 2024" exists
- Client "Pharma Inc." exists

**Test Steps**:
1. Navigate to Contracts section
2. Click "Create New Contract" button
3. Fill in contract details:
   - Contract Name: "Pharma SIEM 2025 Renewal"
   - Client: Select "Pharma Inc."
   - Previous Contract: Select "Pharma SIEM 2024" from dropdown
   - Start Date: "2025-06-01"
   - End Date: "2026-05-31"
   - Contract Value: "165000.00"
   - Status: "DRAFT"
4. Click "Create Contract" button

**Expected Result**:
- Contract created with previousContractId populated
- Relationship established between old and new contract
- Previous contract status updated to "RENEWED"
- Contract history/lineage visible in UI

### CM_TC_004: Contract Creation - Invalid Client ID
**Objective**: Verify error handling for non-existent client  
**Preconditions**: Admin user logged in

**Test Steps**:
1. Navigate to Contracts section
2. Click "Create New Contract" button
3. Attempt to submit form with invalid/deleted client ID
4. Click "Create Contract" button

**Expected Result**:
- Error message: "Client not found"
- Form validation prevents submission
- No contract created in database
- User remains on creation form

### CM_TC_005: Contract Creation - Missing Required Fields
**Objective**: Verify validation for mandatory fields  
**Preconditions**: Admin user logged in

**Test Steps**:
1. Navigate to Contracts section
2. Click "Create New Contract" button
3. Leave required fields empty:
   - Contract Name: (empty)
   - Client: (not selected)
   - Start Date: (empty)
4. Click "Create Contract" button

**Expected Result**:
- Validation errors displayed for each missing field
- Form submission blocked
- Error messages: "Contract name is required", "Client is required", "Start date is required"
- No contract created in database

### CM_TC_006: Contract Creation - Insufficient Permissions (Engineer)
**Objective**: Verify RBAC prevents unauthorized contract creation  
**Preconditions**: Engineer user logged in

**Test Steps**:
1. Navigate to Contracts section
2. Attempt to access "Create New Contract" functionality

**Expected Result**:
- "Create New Contract" button not visible OR
- 403 Forbidden error when accessing creation endpoint
- Error message: "Access denied. Required roles: admin, manager, account_manager. User role: engineer"

### CM_TC_007: Contract Creation - Authorized Roles (Manager)
**Objective**: Verify Manager role can create contracts  
**Preconditions**: Manager user logged in

**Test Steps**:
1. Follow steps from CM_TC_001 with Manager user
2. Verify all contract creation functionality available

**Expected Result**:
- Manager can access all contract creation features
- Contract created successfully
- Same functionality as Admin role

### CM_TC_008: Contract Creation - Authorized Roles (Account Manager)
**Objective**: Verify Account Manager role can create contracts  
**Preconditions**: Account Manager user logged in

**Test Steps**:
1. Follow steps from CM_TC_001 with Account Manager user
2. Verify all contract creation functionality available

**Expected Result**:
- Account Manager can access all contract creation features
- Contract created successfully
- Same functionality as Admin role

---

## 🔧 II. Adding & Configuring Service Scopes within a Contract

### CM_TC_009: Add Service with Dynamic Scope Configuration
**Objective**: Verify adding service with dynamic form generation  
**Preconditions**: 
- Admin user logged in
- Contract "Pharma SIEM 2025" exists
- Service "Managed SIEM" exists with scopeDefinitionTemplate

**Test Steps**:
1. Navigate to contract details page
2. Click "Add Service" button
3. Select "Managed SIEM" from service catalog
4. Verify dynamic form renders with fields:
   - Log Sources (textarea, required)
   - EPS Target (number, required, min: 100, max: 10000)
5. Fill in dynamic scope details:
   - Log Sources: "Firewalls\nServers\nWorkstations"
   - EPS Target: "500"
6. Fill in pricing details:
   - Price: "5000.00"
   - Quantity: "1"
   - Unit: "monthly"
7. Set SAF details:
   - SAF Status: "NOT_INITIATED"
   - Notes: "Initial SIEM deployment"
8. Click "Add Service Scope" button

**Expected Result**:
- ServiceScope created with correct scopeDetails JSON:
  ```json
  {
    "log_sources": "Firewalls\nServers\nWorkstations",
    "eps_target": 500
  }
  ```
- Price, quantity, unit saved correctly
- SAF status set to NOT_INITIATED
- Service appears in contract's service list
- Total contract value updated

### CM_TC_010: Add Service with Select Field Type
**Objective**: Verify dynamic form handles select field types  
**Preconditions**: 
- Admin user logged in
- Contract exists
- Service "Managed EDR" exists with select field in template

**Test Steps**:
1. Navigate to contract details page
2. Click "Add Service" button
3. Select "Managed EDR" from service catalog
4. Verify dynamic form renders with:
   - EDR Platform (select dropdown with options: CarbonBlack, Metras, Rakeen)
   - Endpoint Count (number field)
5. Fill in scope details:
   - EDR Platform: Select "CarbonBlack"
   - Endpoint Count: "250"
6. Set pricing: Price: "12500.00", Quantity: "250", Unit: "endpoints"
7. Click "Add Service Scope" button

**Expected Result**:
- ServiceScope created with correct scopeDetails:
  ```json
  {
    "edr_platform": "CarbonBlack",
    "endpoint_count": 250
  }
  ```
- Select field value saved correctly
- Dropdown options rendered from template

### CM_TC_011: Dynamic Form Validation - Required Fields
**Objective**: Verify dynamic form validates required fields  
**Preconditions**: Admin user logged in, contract exists

**Test Steps**:
1. Navigate to contract details page
2. Click "Add Service" button
3. Select service with required fields in template
4. Leave required dynamic fields empty
5. Attempt to submit form

**Expected Result**:
- Validation errors displayed for required dynamic fields
- Form submission blocked
- Error messages specific to each required field
- No ServiceScope created

### CM_TC_012: Dynamic Form Validation - Field Constraints
**Objective**: Verify dynamic form validates field constraints (min/max)  
**Preconditions**: Admin user logged in, contract exists

**Test Steps**:
1. Add service with number field having min/max constraints
2. Enter value below minimum (e.g., EPS Target: "50" when min is 100)
3. Attempt to submit form
4. Enter value above maximum (e.g., EPS Target: "15000" when max is 10000)
5. Attempt to submit form

**Expected Result**:
- Validation error for value below minimum
- Validation error for value above maximum
- Form submission blocked in both cases
- Appropriate error messages displayed

### CM_TC_013: SAF Management - Update SAF Status
**Objective**: Verify SAF status can be updated for service scope  
**Preconditions**: 
- Admin user logged in
- ServiceScope exists with SAF status "NOT_INITIATED"

**Test Steps**:
1. Navigate to contract details page
2. Locate service scope in services list
3. Click "Manage SAF" or edit service scope
4. Update SAF status to "PENDING_CLIENT_SIGNATURE"
5. Set SAF Service Start Date: "2025-07-01"
6. Set SAF Service End Date: "2026-06-30"
7. Click "Update SAF" button

**Expected Result**:
- SAF status updated to "PENDING_CLIENT_SIGNATURE"
- SAF dates saved correctly
- Status change reflected in UI
- Database updated with new SAF information

### CM_TC_014: SAF Document Upload
**Objective**: Verify SAF document can be uploaded and linked  
**Preconditions**: 
- Admin user logged in
- ServiceScope exists

**Test Steps**:
1. Navigate to service scope SAF management
2. Click "Upload SAF Document" button
3. Select valid PDF file (signed SAF)
4. Verify file preview appears
5. Update SAF status to "CLIENT_SIGNED"
6. Click "Save Changes" button

**Expected Result**:
- SAF document uploaded to /uploads/service-scopes/
- safDocumentLink populated with file URL
- Document accessible via link
- SAF status updated to "CLIENT_SIGNED"

### CM_TC_015: Add Service - Insufficient Permissions (Engineer)
**Objective**: Verify RBAC prevents unauthorized service scope creation  
**Preconditions**: Engineer user logged in

**Test Steps**:
1. Navigate to contract details page
2. Attempt to access "Add Service" functionality

**Expected Result**:
- "Add Service" button not visible OR
- 403 Forbidden error when accessing endpoint
- Error message about insufficient permissions

### CM_TC_016: Service Scope - Invalid Service ID
**Objective**: Verify error handling for non-existent service  
**Preconditions**: Admin user logged in

**Test Steps**:
1. Attempt to add service scope with invalid service ID
2. Submit form

**Expected Result**:
- Error message: "Service not found"
- No service scope created
- Form validation prevents submission

---

## 📄 III. Managing Proposals within a Service Scope

### CM_TC_017: Add Technical Proposal
**Objective**: Verify technical proposal can be added to service scope  
**Preconditions**: 
- Admin user logged in
- ServiceScope exists for "Managed SIEM"
- Technical proposal PDF file ready

**Test Steps**:
1. Navigate to contract details page
2. Locate "Managed SIEM" service scope
3. Click "Manage Proposals" or "Add Proposal"
4. Fill in proposal details:
   - Proposal Type: "TECHNICAL"
   - Title: "SIEM Technical Implementation Plan"
   - Description: "Detailed technical approach for SIEM deployment"
   - Version: "1.0"
   - Status: "DRAFT"
   - Estimated Duration: "30" days
5. Upload proposal document (PDF)
6. Click "Create Proposal" button

**Expected Result**:
- Proposal created and linked to service scope
- Document uploaded to /uploads/proposals/
- documentLink populated with file URL
- Proposal appears in service scope's proposals list
- All metadata saved correctly

### CM_TC_018: Add Financial Proposal
**Objective**: Verify financial proposal can be added to service scope  
**Preconditions**: 
- Admin user logged in
- ServiceScope exists
- Financial proposal document ready

**Test Steps**:
1. Navigate to service scope proposals section
2. Click "Add Proposal" button
3. Fill in proposal details:
   - Proposal Type: "FINANCIAL"
   - Title: "SIEM Financial Proposal"
   - Description: "Cost breakdown and pricing structure"
   - Version: "1.0"
   - Status: "DRAFT"
   - Proposal Value: "150000.00"
   - Estimated Duration: "365" days
4. Upload financial proposal document
5. Click "Create Proposal" button

**Expected Result**:
- Financial proposal created successfully
- Proposal value saved as decimal
- Document uploaded and linked
- Proposal type set to FINANCIAL

### CM_TC_019: Update Proposal Status Workflow
**Objective**: Verify proposal status can be updated through workflow  
**Preconditions**: 
- Admin user logged in
- Proposal exists with status "DRAFT"

**Test Steps**:
1. Navigate to proposal details
2. Update status from "DRAFT" to "SUBMITTED"
3. Set submission date to current date
4. Save changes
5. Later, update status from "SUBMITTED" to "APPROVED"
6. Set approval date to current date
7. Save changes

**Expected Result**:
- Status transitions work correctly
- Submission date saved when status changes to SUBMITTED
- Approval date saved when status changes to APPROVED
- Status history tracked
- Date validation ensures approval date > submission date

### CM_TC_020: Replace Proposal Document
**Objective**: Verify proposal document can be updated/replaced  
**Preconditions**: 
- Admin user logged in
- Proposal exists with uploaded document

**Test Steps**:
1. Navigate to proposal details
2. Click "Replace Document" or "Upload New Version"
3. Select new PDF file
4. Update version to "2.0"
5. Add notes: "Updated based on client feedback"
6. Save changes

**Expected Result**:
- New document uploaded successfully
- documentLink updated to new file
- Version updated to "2.0"
- Notes saved
- Old document may be archived or replaced

### CM_TC_021: Proposal Creation - Missing Required Fields
**Objective**: Verify validation for proposal required fields  
**Preconditions**: Admin user logged in

**Test Steps**:
1. Navigate to add proposal form
2. Leave required fields empty:
   - Proposal Type: (not selected)
   - Document: (not uploaded)
3. Attempt to submit form

**Expected Result**:
- Validation errors for required fields
- Form submission blocked
- Error messages: "Proposal type is required", "Document is required"
- No proposal created

### CM_TC_022: Proposal Management - Insufficient Permissions (Engineer)
**Objective**: Verify RBAC prevents unauthorized proposal management  
**Preconditions**: Engineer user logged in

**Test Steps**:
1. Navigate to service scope with proposals
2. Attempt to access proposal management features

**Expected Result**:
- "Add Proposal" button not visible OR
- 403 Forbidden error when accessing endpoints
- Read-only access to view proposals
- Cannot modify proposal status or upload documents

### CM_TC_023: Multiple Proposals per Service Scope
**Objective**: Verify multiple proposals can exist for one service scope  
**Preconditions**: 
- Admin user logged in
- ServiceScope exists

**Test Steps**:
1. Add Technical proposal (as in CM_TC_017)
2. Add Financial proposal (as in CM_TC_018)
3. Add Combined proposal:
   - Type: "COMBINED"
   - Title: "Complete SIEM Proposal Package"
4. Verify all proposals appear in service scope

**Expected Result**:
- Multiple proposals created for same service scope
- Each proposal has unique ID and type
- All proposals visible in service scope proposals list
- No conflicts between proposals

---

## 🔄 IV. Full End-to-End Workflow Scenario

### CM_TC_024: Complete Contract Lifecycle (E2E)
**Objective**: Test complete realistic workflow from contract creation to proposal approval  
**Preconditions**: 
- Admin user logged in
- Client "Pharma Inc." exists
- Service "Managed SIEM" exists with proper scopeDefinitionTemplate
- All required documents ready for upload

**Test Steps**:

#### Phase 1: Contract Creation
1. Navigate to Contracts section
2. Click "Create New Contract"
3. Fill contract details:
   - Name: "Pharma SIEM 2025"
   - Client: "Pharma Inc."
   - Start Date: "2025-06-01"
   - End Date: "2026-05-31"
   - Value: "150000.00"
   - Status: "DRAFT"
4. Upload main contract PDF
5. Create contract

#### Phase 2: Service Scope Configuration
6. Navigate to created contract details
7. Click "Add Service"
8. Select "Managed SIEM" service
9. Fill dynamic scope form:
   - Log Sources: "Firewalls\nServers\nDomain Controllers"
   - EPS Target: "500"
10. Set pricing:
    - Price: "12500.00"
    - Quantity: "12"
    - Unit: "months"
11. Set initial SAF status: "NOT_INITIATED"
12. Add service scope

#### Phase 3: Proposal Management
13. In service scope, click "Add Proposal"
14. Create Technical Proposal:
    - Type: "TECHNICAL"
    - Title: "SIEM Technical Implementation"
    - Upload technical proposal PDF
    - Status: "SUBMITTED"
    - Set submission date
15. Create Financial Proposal:
    - Type: "FINANCIAL"
    - Title: "SIEM Financial Proposal"
    - Upload financial proposal PDF
    - Status: "SUBMITTED"
    - Proposal Value: "150000.00"
    - Set submission date

#### Phase 4: Contract Finalization
16. Update contract status to "PENDING_APPROVAL"
17. Update SAF status to "PENDING_CLIENT_SIGNATURE"
18. Upload signed SAF document
19. Update SAF status to "CLIENT_SIGNED"

**Expected Result**:
- Contract created with all details correct
- ServiceScope created with proper scopeDetails JSON:
  ```json
  {
    "log_sources": "Firewalls\nServers\nDomain Controllers",
    "eps_target": 500
  }
  ```
- Both proposals created and linked to service scope
- All documents uploaded and accessible
- Contract status progression tracked
- SAF lifecycle managed correctly
- Database relationships intact:
  - Client → Contract → ServiceScope → Service
  - ServiceScope → Proposals
- Total contract value calculated correctly
- All file uploads in correct directories
- UI reflects all status changes

### CM_TC_025: Multi-Service Contract (E2E)
**Objective**: Test contract with multiple different services  
**Preconditions**: 
- Admin user logged in
- Client exists
- Multiple services exist ("Managed SIEM", "Managed EDR")

**Test Steps**:
1. Create contract "TechCorp Security Package 2025"
2. Add "Managed SIEM" service:
   - Configure scope: Log Sources, EPS Target
   - Set pricing and SAF details
3. Add "Managed EDR" service:
   - Configure scope: EDR Platform, Endpoint Count
   - Set different pricing and SAF details
4. Add proposals for each service scope
5. Verify total contract value calculation

**Expected Result**:
- Contract with multiple service scopes
- Each service scope has different scopeDetails structure
- Total contract value = sum of all service scope values
- Independent SAF management for each service
- Separate proposals for each service scope

---

## 🔒 V. Data Integrity, RBAC, and Error Handling

### CM_TC_026: Database Relationship Integrity
**Objective**: Verify all database relationships are maintained correctly  
**Preconditions**: Complete contract with services and proposals exists

**Test Steps**:
1. Query database to verify relationships:
   - Client → Contract (foreign key)
   - Contract → ServiceScope (foreign key)
   - ServiceScope → Service (foreign key)
   - ServiceScope → Proposal (foreign key)
2. Attempt to delete referenced entities
3. Verify cascade/restrict behavior

**Expected Result**:
- All foreign key relationships intact
- Cascade deletes work where configured
- Restrict deletes prevent orphaned records
- Referential integrity maintained

### CM_TC_027: RBAC - Admin Full Access
**Objective**: Verify Admin role has complete access to all features  
**Preconditions**: Admin user logged in

**Test Steps**:
1. Test all contract operations (CRUD)
2. Test all service scope operations
3. Test all proposal operations
4. Test file upload operations
5. Test statistics and reporting features

**Expected Result**:
- Admin can perform all operations
- No 403 Forbidden errors
- All UI elements visible and functional

### CM_TC_028: RBAC - Manager Access
**Objective**: Verify Manager role has appropriate access  
**Preconditions**: Manager user logged in

**Test Steps**:
1. Test contract creation and modification
2. Test service scope management
3. Test proposal management
4. Test statistics access

**Expected Result**:
- Manager has same access as Admin for contract management
- Can view statistics and reports
- All contract workflow operations available

### CM_TC_029: RBAC - Account Manager Access
**Objective**: Verify Account Manager role has appropriate access  
**Preconditions**: Account Manager user logged in

**Test Steps**:
1. Test contract operations
2. Test service scope operations
3. Test proposal operations
4. Verify cannot access admin-only features

**Expected Result**:
- Account Manager can manage contracts and related entities
- Cannot access user management or system configuration
- Appropriate level of access for client account management

### CM_TC_030: RBAC - Engineer Limited Access
**Objective**: Verify Engineer role has read-only access  
**Preconditions**: Engineer user logged in

**Test Steps**:
1. Attempt to create/modify contracts
2. Attempt to add/modify service scopes
3. Attempt to manage proposals
4. Verify can view but not modify

**Expected Result**:
- Engineer can view contracts, service scopes, proposals
- Cannot create, update, or delete any entities
- 403 Forbidden errors for modification attempts
- Read-only UI elements

### CM_TC_031: Error Handling - Database Connection Loss
**Objective**: Verify graceful handling of database errors  
**Preconditions**: System running normally

**Test Steps**:
1. Simulate database connection loss
2. Attempt contract operations
3. Verify error messages and recovery

**Expected Result**:
- Appropriate error messages displayed
- No system crashes
- Graceful degradation
- User-friendly error messages

### CM_TC_032: Error Handling - Invalid File Uploads
**Objective**: Verify file upload validation and error handling  
**Preconditions**: User logged in with upload permissions

**Test Steps**:
1. Attempt to upload file exceeding size limit (>10MB)
2. Attempt to upload invalid file type (e.g., .exe)
3. Attempt to upload corrupted file
4. Attempt upload with no file selected

**Expected Result**:
- File size validation error
- File type validation error
- Corrupted file handling
- Missing file validation
- Clear error messages for each scenario

### CM_TC_033: Error Handling - Concurrent Modifications
**Objective**: Verify handling of concurrent user modifications  
**Preconditions**: Two users logged in

**Test Steps**:
1. User A opens contract for editing
2. User B modifies same contract
3. User A attempts to save changes
4. Verify conflict resolution

**Expected Result**:
- Optimistic locking or conflict detection
- Appropriate error message about concurrent modification
- Data integrity maintained
- User prompted to refresh and retry

### CM_TC_034: File Upload Limits and Security
**Objective**: Verify file upload security measures  
**Preconditions**: User with upload permissions

**Test Steps**:
1. Test file size limits for each document type:
   - Contract documents: 10MB limit
   - SAF documents: 5MB limit
   - Proposal documents: 10MB limit
2. Test file type restrictions (only PDF allowed)
3. Test malicious file upload attempts
4. Verify file storage security

**Expected Result**:
- Size limits enforced correctly
- Only PDF files accepted
- Malicious files rejected
- Files stored securely with proper permissions
- File paths not directly accessible

### CM_TC_035: Data Validation Edge Cases
**Objective**: Verify comprehensive data validation  
**Preconditions**: User with appropriate permissions

**Test Steps**:
1. Test date validation:
   - Contract end date before start date
   - SAF dates outside contract period
   - Proposal dates in future
2. Test numeric validation:
   - Negative prices
   - Zero quantities
   - Extremely large numbers
3. Test string validation:
   - Very long contract names
   - Special characters in names
   - Empty required strings

**Expected Result**:
- All validation rules enforced
- Appropriate error messages
- Data integrity maintained
- No SQL injection vulnerabilities

---

## 📊 Test Execution Guidelines

### Manual Testing Approach
1. **Sequential Execution**: Run tests in order as later tests depend on earlier ones
2. **Data Cleanup**: Reset test data between test runs
3. **Browser Testing**: Test on Chrome, Firefox, Safari
4. **Mobile Responsiveness**: Verify UI works on mobile devices
5. **Performance**: Monitor response times for large operations

### Test Data Management
- Use consistent test data across all test cases
- Create setup scripts for test data initialization
- Implement cleanup procedures for test isolation
- Document test data dependencies

### Error Documentation
- Screenshot all error conditions
- Document exact error messages
- Note browser console errors
- Record network request/response details

### Success Criteria
- ✅ All positive test cases pass
- ✅ All negative test cases fail appropriately
- ✅ RBAC enforced correctly for all roles
- ✅ File uploads work securely
- ✅ Data integrity maintained
- ✅ Error handling graceful and informative

---

## 🎯 Expected Outcomes

### System Validation
- **Contract Management**: Complete CRUD operations working
- **Dynamic Forms**: Service scope configuration flexible and robust
- **Proposal Workflow**: Full lifecycle management functional
- **File Management**: Secure upload and storage working
- **RBAC**: Role-based permissions properly enforced

### Quality Assurance
- **Data Integrity**: All relationships and constraints working
- **Error Handling**: Graceful failure and recovery
- **Security**: File uploads and access control secure
- **Performance**: Acceptable response times
- **Usability**: Intuitive user interface and workflow

### Production Readiness
- **Functionality**: All features working as designed
- **Security**: No vulnerabilities identified
- **Reliability**: Stable under normal usage
- **Maintainability**: Code quality and documentation adequate
- **Scalability**: Architecture supports growth

---

**Test Plan Version**: 1.0  
**Created By**: AI Coder Assistant  
**Review Status**: Ready for Execution  
**Estimated Execution Time**: 8-12 hours for complete test suite 