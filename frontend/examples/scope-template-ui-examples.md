# Scope Template UI Components - Usage Examples

This document provides comprehensive examples of how to use the React UI components for managing scope definition templates in the MSSP Client Management Platform.

## Overview

The scope template UI allows administrators to define dynamic form structures for service scope configuration. When a service is added to a contract, the frontend will use these templates to generate appropriate form fields.

## Components

### 1. ScopeTemplateManager
Main component for managing scope definition templates for services.

### 2. ScopeFieldsList
Displays a list of scope definition fields with management actions.

### 3. ScopeFieldEditor
Modal for adding/editing individual scope definition fields.

## Integration Example

### Route Setup
```typescript
// In your routing configuration
import { ScopeTemplateManager } from '../components/services';

// Add route for scope template management
<Route 
  path="/admin/services/:serviceId/scope-template" 
  element={<ScopeTemplateManager />} 
/>
```

### Navigation Integration
```typescript
// In your service management UI
const navigateToScopeTemplate = (serviceId: string) => {
  navigate(`/admin/services/${serviceId}/scope-template`);
};

// Add button to service edit/detail page
<button 
  onClick={() => navigateToScopeTemplate(service.id)}
  className="scope-template-button"
>
  Manage Scope Template
</button>
```

## Real-World Usage Scenarios

### Scenario 1: Managed EDR Service Template

An admin wants to create a scope template for a "Managed EDR" service with the following parameters:

1. **EDR Platform** (Dropdown)
   - Options: CarbonBlack, Metras, Rakeen, SentinelOne
   - Required: Yes

2. **Endpoint Count** (Number)
   - Min: 1, Max: 10000
   - Required: Yes

3. **Log Retention Days** (Number)
   - Min: 7, Max: 365
   - Default: 30
   - Required: No

4. **24x7 Monitoring** (Yes/No)
   - Default: Yes
   - Required: Yes

5. **Custom Rules** (Long Text)
   - Max Length: 1000
   - Required: No

**UI Flow:**
1. Admin navigates to `/admin/services/{edr-service-id}/scope-template`
2. Clicks "Add Parameter" for each field
3. Configures each field using the ScopeFieldEditor modal
4. Reorders fields as needed using up/down arrows
5. Saves the complete template

### Scenario 2: SIEM Monitoring Service Template

For a SIEM monitoring service, an admin might define:

1. **SIEM Platform** (Dropdown)
   - Options: Splunk, QRadar, ArcSight, LogRhythm
   - Required: Yes

2. **Log Sources Count** (Number)
   - Min: 1, Max: 1000
   - Required: Yes

3. **Daily Log Volume (GB)** (Number)
   - Min: 1, Max: 10000
   - Required: Yes

4. **Compliance Requirements** (Dropdown)
   - Options: PCI-DSS, ISO 27001, NIST, SOX, HIPAA
   - Required: No

5. **Custom Dashboards** (Yes/No)
   - Default: No
   - Required: No

### Scenario 3: Adding New Platform Option

When a new EDR platform "CrowdStrike" becomes available:

1. Admin navigates to the Managed EDR scope template
2. Clicks "Edit" on the "EDR Platform" field
3. In the ScopeFieldEditor modal, adds "CrowdStrike" to the options list
4. Saves the field changes
5. Saves the template

**UI Steps:**
```
1. Navigate to: /admin/services/{edr-service-id}/scope-template
2. Find "EDR Platform" field in the list
3. Click "Edit" button
4. In "Dropdown Options" section:
   - Type "CrowdStrike" in the input field
   - Click "Add" button
5. Click "Update Parameter"
6. Click "Save Template"
```

## Component Props and Usage

### ScopeTemplateManager Props
```typescript
// No props needed - uses URL params and context
// Route: /admin/services/:serviceId/scope-template
```

### ScopeFieldsList Props
```typescript
interface ScopeFieldsListProps {
  fields: ScopeDefinitionField[];
  onEdit: (index: number) => void;
  onDelete: (index: number) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
}
```

### ScopeFieldEditor Props
```typescript
interface ScopeFieldEditorProps {
  field?: ScopeDefinitionField;
  existingFieldNames: string[];
  onSave: (field: ScopeDefinitionField) => void;
  onCancel: () => void;
  isEdit?: boolean;
}
```

## State Management

The components use React hooks for state management:

```typescript
// Template state
const [template, setTemplate] = useState<ScopeDefinitionTemplate>({
  fields: [],
  version: '1.0',
  description: ''
});

// UI state
const [uiState, setUIState] = useState<ScopeTemplateUIState>({
  isLoading: true,
  isSaving: false,
  error: null,
  hasUnsavedChanges: false,
  editingFieldIndex: null,
  showAddFieldModal: false,
  showDeleteConfirmation: false,
  fieldToDelete: null
});
```

## API Integration

The components integrate with the backend APIs:

```typescript
// Fetch existing template
const templateResponse = await apiService.getScopeDefinitionTemplate(serviceId);

// Save template changes
const updateData: UpdateScopeDefinitionTemplateDto = {
  scopeDefinitionTemplate: template
};
await apiService.updateScopeDefinitionTemplate(serviceId, updateData);
```

## Error Handling

The UI handles various error scenarios:

1. **Permission Denied**: Shows access denied message for non-admin users
2. **Service Not Found**: Displays error with retry option
3. **Network Errors**: Shows error toast with retry functionality
4. **Validation Errors**: Inline field validation with error messages
5. **Save Failures**: Error toast with specific error message

## Accessibility Features

- **Keyboard Navigation**: All interactive elements are keyboard accessible
- **Focus Management**: Proper focus handling in modals
- **Screen Reader Support**: Semantic HTML and ARIA labels
- **Color Contrast**: High contrast colors for readability
- **Error Announcements**: Screen reader friendly error messages

## Responsive Design

The UI adapts to different screen sizes:

- **Desktop**: Full layout with side-by-side actions
- **Tablet**: Stacked layout with adjusted spacing
- **Mobile**: Single column layout with touch-friendly buttons

## Performance Considerations

- **Lazy Loading**: Components are loaded only when needed
- **Memoization**: React.memo and useCallback for optimization
- **Debounced Saves**: Prevents excessive API calls
- **Virtual Scrolling**: For large field lists (future enhancement)

## Testing Examples

### Unit Tests
```typescript
describe('ScopeTemplateManager', () => {
  it('should load service and template on mount', async () => {
    // Test implementation
  });

  it('should save template changes', async () => {
    // Test implementation
  });

  it('should handle permission denied', () => {
    // Test implementation
  });
});
```

### Integration Tests
```typescript
describe('Scope Template Management Flow', () => {
  it('should allow admin to create complete template', async () => {
    // Test full workflow
  });

  it('should prevent non-admin access', async () => {
    // Test security
  });
});
```

## Future Enhancements

1. **Template Versioning**: Track template changes over time
2. **Template Import/Export**: Share templates between services
3. **Field Dependencies**: Conditional field visibility
4. **Advanced Validation**: Custom validation rules
5. **Template Preview**: Preview generated forms
6. **Bulk Operations**: Manage multiple fields at once
7. **Template Library**: Predefined templates for common services

## Troubleshooting

### Common Issues

1. **Template Not Saving**
   - Check user permissions (Admin/Manager required)
   - Verify network connectivity
   - Check browser console for errors

2. **Field Validation Errors**
   - Ensure field names are unique
   - Check required field constraints
   - Verify option lists for select fields

3. **UI Not Loading**
   - Verify service ID in URL
   - Check authentication status
   - Ensure backend APIs are accessible

### Debug Mode

Enable debug logging:
```typescript
// In development environment
localStorage.setItem('debug', 'scope-template:*');
```

This comprehensive UI implementation provides administrators with powerful tools to define dynamic service scope structures while maintaining simplicity and usability. 