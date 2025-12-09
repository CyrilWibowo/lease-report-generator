import React, { useState } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import { PropertyLease, MotorVehicleLease } from '../types/Lease';
import OpeningBalanceManager from './OpeningBalanceManager';
import './ReportModal.css';

interface ReportModalProps {
  onClose: () => void;
  propertyLeases: PropertyLease[];
  motorVehicleLeases: MotorVehicleLease[];
  onUpdateLeases: (leases: (PropertyLease | MotorVehicleLease)[]) => void;
}

export interface ReportParams {
  reportType: 'Summary' | 'Detail';
  includedLeases: 'Property' | 'Motor' | 'All';
  leaseLiabilityOpening: string;
  leaseLiabilityClosing: string;
}

const ReportModal: React.FC<ReportModalProps> = ({
  onClose,
  propertyLeases,
  motorVehicleLeases,
  onUpdateLeases
}) => {
  const [params, setParams] = useState<ReportParams>({
    reportType: 'Summary',
    includedLeases: 'All',
    leaseLiabilityOpening: '',
    leaseLiabilityClosing: ''
  });

  const [errors, setErrors] = useState<{ [key: string]: boolean }>({});
  const [openingBalanceManagerType, setOpeningBalanceManagerType] = useState<'Property' | 'Motor Vehicle' | null>(null);

  const handleInputChange = (field: keyof ReportParams, value: string) => {
    setParams({ ...params, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: false });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: boolean } = {};
    let isValid = true;

    if (!params.leaseLiabilityOpening) {
      newErrors.leaseLiabilityOpening = true;
      isValid = false;
    }
    if (!params.leaseLiabilityClosing) {
      newErrors.leaseLiabilityClosing = true;
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleGenerate = () => {
    if (validateForm()) {
      // TODO: Implement report generation logic
      console.log('Generating report with params:', params);
      onClose();
    } else {
      alert('Please fill in all required fields');
    }
  };

  return (
    <div className="report-modal-overlay" onClick={onClose}>
      <div className="report-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="report-modal-header">
          <h2 className="report-modal-title">Generate Report</h2>
          <button className="report-close-button" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>

        <div className="report-form-grid">
          <div className="report-form-group">
            <label className="report-form-label">Type of Report *</label>
            <select
              className="report-form-input"
              value={params.reportType}
              onChange={(e) => handleInputChange('reportType', e.target.value)}
            >
              <option value="Summary">Summary</option>
              <option value="Detail">Detail</option>
            </select>
          </div>

          <div className="report-form-group">
            <label className="report-form-label">Included Leases *</label>
            <select
              className="report-form-input"
              value={params.includedLeases}
              onChange={(e) => handleInputChange('includedLeases', e.target.value)}
            >
              <option value="Property">Property</option>
              <option value="Motor">Motor</option>
              <option value="All">All</option>
            </select>
          </div>

          <div className="report-form-group">
            <label className="report-form-label">Lease Liability Opening *</label>
            {errors.leaseLiabilityOpening && <span className="report-error-text">This field is required</span>}
            <input
              type="date"
              className={errors.leaseLiabilityOpening ? 'report-form-input-error' : 'report-form-input'}
              value={params.leaseLiabilityOpening}
              onChange={(e) => handleInputChange('leaseLiabilityOpening', e.target.value)}
            />
          </div>

          <div className="report-form-group">
            <label className="report-form-label">Lease Liability Closing *</label>
            {errors.leaseLiabilityClosing && <span className="report-error-text">This field is required</span>}
            <input
              type="date"
              className={errors.leaseLiabilityClosing ? 'report-form-input-error' : 'report-form-input'}
              value={params.leaseLiabilityClosing}
              onChange={(e) => handleInputChange('leaseLiabilityClosing', e.target.value)}
            />
          </div>
        </div>

        <div className="report-opening-balance-buttons">
          {(params.includedLeases === 'Property' || params.includedLeases === 'All') && (
            <button
              className="report-ob-button"
              onClick={() => setOpeningBalanceManagerType('Property')}
            >
              Manage Property Opening Balance
            </button>
          )}
          {(params.includedLeases === 'Motor' || params.includedLeases === 'All') && (
            <button
              className="report-ob-button"
              onClick={() => setOpeningBalanceManagerType('Motor Vehicle')}
            >
              Manage Motor Vehicle Opening Balance
            </button>
          )}
        </div>

        <div className="report-modal-actions">
          <button className="report-cancel-button" onClick={onClose}>Cancel</button>
          <button className="report-generate-button" onClick={handleGenerate}>Generate Report</button>
        </div>
      </div>

      {openingBalanceManagerType && (
        <OpeningBalanceManager
          type={openingBalanceManagerType}
          propertyLeases={propertyLeases}
          motorVehicleLeases={motorVehicleLeases}
          onClose={() => setOpeningBalanceManagerType(null)}
          onSave={onUpdateLeases}
        />
      )}
    </div>
  );
};

export default ReportModal;
