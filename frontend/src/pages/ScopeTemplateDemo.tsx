import React from 'react';
import { useParams } from 'react-router-dom';
import { ScopeTemplateManager } from '../components/services';

/**
 * ScopeTemplateDemo Page
 * Demo page to showcase scope template management functionality
 * This would typically be integrated into the admin section
 */
const ScopeTemplateDemo: React.FC = () => {
  const { serviceId } = useParams<{ serviceId: string }>();

  // In a real implementation, this would be part of the admin routing
  // Example route: /admin/services/:serviceId/scope-template

  return (
    <div>
      <ScopeTemplateManager />
    </div>
  );
};

export default ScopeTemplateDemo; 