import React from 'react';
import AdminLicensePoolForm from './AdminLicensePoolForm';

/**
 * Create License Pool Page
 * Wrapper component for creating new license pools
 */
const CreateLicensePoolPage: React.FC = () => {
  return <AdminLicensePoolForm mode="create" />;
};

export default CreateLicensePoolPage; 