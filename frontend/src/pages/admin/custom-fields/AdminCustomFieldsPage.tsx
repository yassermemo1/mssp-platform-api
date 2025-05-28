import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CustomFieldEntityType, 
  ENTITY_TYPE_DISPLAY_NAMES 
} from '../../../types/customFields';
import './AdminCustomFieldsPage.css';

/**
 * AdminCustomFieldsPage Component
 * Main entry point for custom field management
 * Allows admins to select an entity type to manage custom fields for
 */
const AdminCustomFieldsPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedEntityType, setSelectedEntityType] = useState<CustomFieldEntityType | ''>('');

  /**
   * Handle entity type selection
   */
  const handleEntityTypeSelect = (entityType: CustomFieldEntityType) => {
    setSelectedEntityType(entityType);
    navigate(`/admin/settings/custom-fields/${entityType}`);
  };

  /**
   * Get entity type cards data
   */
  const getEntityTypeCards = () => {
    return Object.values(CustomFieldEntityType).map(entityType => ({
      type: entityType,
      displayName: ENTITY_TYPE_DISPLAY_NAMES[entityType],
      description: getEntityDescription(entityType),
      icon: getEntityIcon(entityType),
    }));
  };

  /**
   * Get description for each entity type
   */
  const getEntityDescription = (entityType: CustomFieldEntityType): string => {
    const descriptions: Record<CustomFieldEntityType, string> = {
      [CustomFieldEntityType.CLIENT]: 'Manage custom fields for client profiles and information',
      [CustomFieldEntityType.CONTRACT]: 'Define additional fields for contract details and metadata',
      [CustomFieldEntityType.PROPOSAL]: 'Add custom fields to capture proposal-specific information',
      [CustomFieldEntityType.SERVICE]: 'Configure custom fields for service catalog entries',
      [CustomFieldEntityType.SERVICE_SCOPE]: 'Define fields for service scope configurations',
      [CustomFieldEntityType.HARDWARE_ASSET]: 'Manage custom fields for hardware asset tracking',
      [CustomFieldEntityType.USER]: 'Add custom fields to user profiles and information',
      [CustomFieldEntityType.FINANCIAL_TRANSACTION]: 'Configure fields for financial transaction details',
      [CustomFieldEntityType.LICENSE_POOL]: 'Define custom fields for license pool management',
      [CustomFieldEntityType.TEAM_ASSIGNMENT]: 'Add fields for team assignment configurations',
    };
    return descriptions[entityType];
  };

  /**
   * Get icon for each entity type
   */
  const getEntityIcon = (entityType: CustomFieldEntityType): string => {
    const icons: Record<CustomFieldEntityType, string> = {
      [CustomFieldEntityType.CLIENT]: '👥',
      [CustomFieldEntityType.CONTRACT]: '📄',
      [CustomFieldEntityType.PROPOSAL]: '📋',
      [CustomFieldEntityType.SERVICE]: '⚙️',
      [CustomFieldEntityType.SERVICE_SCOPE]: '🔧',
      [CustomFieldEntityType.HARDWARE_ASSET]: '💻',
      [CustomFieldEntityType.USER]: '👤',
      [CustomFieldEntityType.FINANCIAL_TRANSACTION]: '💰',
      [CustomFieldEntityType.LICENSE_POOL]: '🔑',
      [CustomFieldEntityType.TEAM_ASSIGNMENT]: '👨‍💼',
    };
    return icons[entityType];
  };

  return (
    <div className="admin-custom-fields-page">
      <div className="page-header">
        <h1>Custom Field Management</h1>
        <p className="page-description">
          Configure custom fields for different entities in your system. 
          Select an entity type below to manage its custom field definitions.
        </p>
      </div>

      <div className="entity-type-grid">
        {getEntityTypeCards().map(({ type, displayName, description, icon }) => (
          <div
            key={type}
            className="entity-type-card"
            onClick={() => handleEntityTypeSelect(type)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                handleEntityTypeSelect(type);
              }
            }}
          >
            <div className="entity-icon">{icon}</div>
            <h3 className="entity-name">{displayName}</h3>
            <p className="entity-description">{description}</p>
            <div className="card-action">
              <span>Manage Fields →</span>
            </div>
          </div>
        ))}
      </div>

      <div className="help-section">
        <div className="help-card">
          <h3>💡 About Custom Fields</h3>
          <p>
            Custom fields allow you to capture additional information specific to your business needs. 
            You can define various field types including text, numbers, dates, dropdowns, and more.
          </p>
          <ul>
            <li>Fields can be required or optional</li>
            <li>Set validation rules to ensure data quality</li>
            <li>Control field display order and appearance</li>
            <li>Activate or deactivate fields as needed</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AdminCustomFieldsPage; 