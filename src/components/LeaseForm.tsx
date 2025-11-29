import React from 'react';
import { Lease } from '../types/Lease';
import './LeaseForm.css';

interface LeaseFormProps {
  lease: Lease;
  leaseType: 'Property' | 'Motor Vehicle';
  errors: { [key: string]: boolean };
  committedYears: number;
  onInputChange: (field: string, value: string) => void;
  onIncrementMethodChange: (year: number, value: string) => void;
  onOverrideAmountChange: (year: number, value: string) => void;
  onSubmit: () => void;
  onClose: () => void;
}

const LeaseForm: React.FC<LeaseFormProps> = ({
  lease,
  leaseType,
  errors,
  committedYears,
  onInputChange,
  onIncrementMethodChange,
  onOverrideAmountChange,
  onSubmit,
  onClose
}) => {
  return (
    <div className="lease-form-modal">
      <h2>Add {leaseType} Lease</h2>

      <div className="form-grid">
        <div className="form-group">
          <label>{leaseType === 'Property' ? 'Property Address' : 'Description'} *</label>
          {errors[leaseType === 'Property' ? 'propertyAddress' : 'description'] && (
            <span className="error-text">This field is required</span>
          )}
          <input
            type="text"
            className={errors[leaseType === 'Property' ? 'propertyAddress' : 'description'] ? 'error' : ''}
            value={leaseType === 'Property' ? lease.propertyAddress : lease.description}
            onChange={(e) => onInputChange(leaseType === 'Property' ? 'propertyAddress' : 'description', e.target.value)}
            placeholder={`Enter ${leaseType === 'Property' ? 'property address' : 'description'}`}
          />
        </div>

        <div className="form-group">
          <label>Commencement Date *</label>
          {errors.commencementDate && <span className="error-text">This field is required</span>}
          <input
            type="date"
            className={errors.commencementDate ? 'error' : ''}
            value={lease.commencementDate}
            onChange={(e) => onInputChange('commencementDate', e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Expiry Date *</label>
          {errors.expiryDate && <span className="error-text">This field is required</span>}
          <input
            type="date"
            className={errors.expiryDate ? 'error' : ''}
            value={lease.expiryDate}
            onChange={(e) => onInputChange('expiryDate', e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Options (Years) *</label>
          {errors.options && <span className="error-text">This field is required</span>}
          <input
            type="number"
            className={errors.options ? 'error' : ''}
            value={lease.options}
            onChange={(e) => onInputChange('options', e.target.value)}
            placeholder="0"
            min="0"
          />
        </div>

        <div className="form-group">
          <label>Original Annual Rent *</label>
          {errors.originalAnnualRent && <span className="error-text">This field is required</span>}
          <input
            type="number"
            className={errors.originalAnnualRent ? 'error' : ''}
            value={lease.originalAnnualRent}
            onChange={(e) => onInputChange('originalAnnualRent', e.target.value)}
            placeholder="0.00"
            step="0.01"
          />
        </div>

        <div className="form-group">
          <label>RBA CPI Rate (%) *</label>
          {errors.rbaCpiRate && <span className="error-text">This field is required</span>}
          <input
            type="number"
            className={errors.rbaCpiRate ? 'error' : ''}
            value={lease.rbaCpiRate}
            onChange={(e) => onInputChange('rbaCpiRate', e.target.value)}
            placeholder="0.00"
            step="0.01"
          />
        </div>

        <div className="form-group">
          <label>Fixed Increment Rate (%) *</label>
          {errors.fixedIncrementRate && <span className="error-text">This field is required</span>}
          <input
            type="number"
            className={errors.fixedIncrementRate ? 'error' : ''}
            value={lease.fixedIncrementRate}
            onChange={(e) => onInputChange('fixedIncrementRate', e.target.value)}
            placeholder="0.00"
            step="0.01"
          />
        </div>

        <div className="form-group">
          <label>Borrowing Rate (%) *</label>
          {errors.borrowingRate && <span className="error-text">This field is required</span>}
          <input
            type="number"
            className={errors.borrowingRate ? 'error' : ''}
            value={lease.borrowingRate}
            onChange={(e) => onInputChange('borrowingRate', e.target.value)}
            placeholder="0.00"
            step="0.01"
          />
        </div>
      </div>

      {committedYears > 1 && (
        <div className="increment-methods-section">
          <h4>Increment Methods (Committed Years: {committedYears})</h4>
          <div className="increment-methods-grid">
            {Array.from({ length: committedYears - 1 }, (_, i) => i + 2).map((year) => (
              <div key={year} className="increment-method-group">
                <div className="form-group">
                  <label>Year {year}</label>
                  <select
                    value={lease.incrementMethods[year] || ''}
                    onChange={(e) => onIncrementMethodChange(year, e.target.value)}
                    className={errors[`incrementMethod_${year}`] ? 'error' : ''}
                  >
                    <option value="">Select method...</option>
                    <option value="Fixed">Fix Rate</option>
                    <option value="Market">Market/Override</option>
                    <option value="CPI">CPI</option>
                  </select>
                  {errors[`incrementMethod_${year}`] && (
                    <span className="error-text">This field is required</span>
                  )}
                </div>

                {lease.incrementMethods[year] === 'Market' && (
                  <div className="form-group override-amount">
                    <label>Override Amount *</label>
                    {errors[`overrideAmount_${year}`] && (
                      <span className="error-text">Override amount is required</span>
                    )}
                    <input
                      type="number"
                      className={errors[`overrideAmount_${year}`] ? 'error' : ''}
                      value={lease.overrideAmounts[year] || ''}
                      onChange={(e) => onOverrideAmountChange(year, e.target.value)}
                      placeholder="Enter override amount"
                      step="0.01"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="modal-actions">
        <button className="cancel-button" onClick={onClose}>Cancel</button>
        <button className="save-button" onClick={onSubmit}>Save Lease</button>
      </div>
    </div>
  );
};

export default LeaseForm;