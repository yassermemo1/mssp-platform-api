import React from 'react';
import AdminLicensePoolForm from './AdminLicensePoolForm';

/**
 * Edit License Pool Page
 * Wrapper component for editing existing license pools
 */
const EditLicensePoolPage: React.FC = () => {
  return <AdminLicensePoolForm mode="edit" />;
};

export default EditLicensePoolPage; 