// components/LeaseForm.tsx
import React from 'react';
import { Lease, PropertyLease, MotorVehicleLease } from '../types/Lease';
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
  const isPropertyLease = lease.type === 'Property';

  return (
    <div className="lease-form-modal">
      <h2>Add {leaseType} Lease</h2>

      <div className="form-grid">
        {/* Lessor - Common field */}
        <div className="form-group">
          <label>Lessor *</label>
          {errors.lessor && <span className="error-text">This field is required</span>}
          <input
            type="text"
            className={errors.lessor ? 'error' : ''}
            value={lease.lessor}
            onChange={(e) => onInputChange('lessor', e.target.value)}
            placeholder="Enter lessor"
          />
        </div>

        {/* Property Lease Fields */}
        {isPropertyLease && (
          <>
            <div className="form-group">
              <label>Property Address *</label>
              {errors.propertyAddress && <span className="error-text">This field is required</span>}
              <input
                type="text"
                className={errors.propertyAddress ? 'error' : ''}
                value={(lease as PropertyLease).propertyAddress}
                onChange={(e) => onInputChange('propertyAddress', e.target.value)}
                placeholder="Enter property address"
              />
            </div>

            <div className="form-group">
              <label>Commencement Date *</label>
              {errors.commencementDate && <span className="error-text">This field is required</span>}
              <input
                type="date"
                className={errors.commencementDate ? 'error' : ''}
                value={(lease as PropertyLease).commencementDate}
                onChange={(e) => onInputChange('commencementDate', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Expiry Date *</label>
              {errors.expiryDate && <span className="error-text">This field is required</span>}
              <input
                type="date"
                className={errors.expiryDate ? 'error' : ''}
                value={(lease as PropertyLease).expiryDate}
                onChange={(e) => onInputChange('expiryDate', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Options (Years) *</label>
              {errors.options && <span className="error-text">This field is required</span>}
              <input
                type="number"
                className={errors.options ? 'error' : ''}
                value={(lease as PropertyLease).options}
                onChange={(e) => onInputChange('options', e.target.value)}
                placeholder="0"
                min="0"
              />
            </div>
          </>
        )}

        {/* Motor Vehicle Lease Fields */}
        {!isPropertyLease && (
          <>
            <div className="form-group">
              <label>Entity Name *</label>
              {errors.entityName && <span className="error-text">This field is required</span>}
              <input
                type="text"
                className={errors.entityName ? 'error' : ''}
                value={(lease as MotorVehicleLease).entityName}
                onChange={(e) => onInputChange('entityName', e.target.value)}
                placeholder="Enter entity name"
              />
            </div>

            <div className="form-group">
              <label>Description *</label>
              {errors.description && <span className="error-text">This field is required</span>}
              <input
                type="text"
                className={errors.description ? 'error' : ''}
                value={(lease as MotorVehicleLease).description}
                onChange={(e) => onInputChange('description', e.target.value)}
                placeholder="Enter description"
              />
            </div>

            <div className="form-group">
              <label>VIN/Serial No. *</label>
              {errors.vinSerialNo && <span className="error-text">This field is required</span>}
              <input
                type="text"
                className={errors.vinSerialNo ? 'error' : ''}
                value={(lease as MotorVehicleLease).vinSerialNo}
                onChange={(e) => onInputChange('vinSerialNo', e.target.value)}
                placeholder="Enter VIN/Serial No."
              />
            </div>

            <div className="form-group">
              <label>Rego No. *</label>
              {errors.regoNo && <span className="error-text">This field is required</span>}
              <input
                type="text"
                className={errors.regoNo ? 'error' : ''}
                value={(lease as MotorVehicleLease).regoNo}
                onChange={(e) => onInputChange('regoNo', e.target.value)}
                placeholder="Enter Rego No."
              />
            </div>

            <div className="form-group">
              <label>Delivery Date *</label>
              {errors.deliveryDate && <span className="error-text">This field is required</span>}
              <input
                type="date"
                className={errors.deliveryDate ? 'error' : ''}
                value={(lease as MotorVehicleLease).deliveryDate}
                onChange={(e) => onInputChange('deliveryDate', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Expiry Date *</label>
              {errors.expiryDate && <span className="error-text">This field is required</span>}
              <input
                type="date"
                className={errors.expiryDate ? 'error' : ''}
                value={(lease as MotorVehicleLease).expiryDate}
                onChange={(e) => onInputChange('expiryDate', e.target.value)}
              />
            </div>
          </>
        )}

        {/* Annual Rent - Common field */}
        <div className="form-group">
          <label>Annual Rent *</label>
          {errors.annualRent && <span className="error-text">This field is required</span>}
          <input
            type="number"
            className={errors.annualRent ? 'error' : ''}
            value={lease.annualRent}
            onChange={(e) => onInputChange('annualRent', e.target.value)}
            placeholder="0.00"
            step="0.01"
          />
        </div>

        {/* RBA CPI Rate - Common field */}
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

        {/* Borrowing Rate - Common field */}
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

        {/* Fixed Increment Rate - Property only */}
        {isPropertyLease && (
          <div className="form-group">
            <label>Fixed Increment Rate (%) *</label>
            {errors.fixedIncrementRate && <span className="error-text">This field is required</span>}
            <input
              type="number"
              className={errors.fixedIncrementRate ? 'error' : ''}
              value={(lease as PropertyLease).fixedIncrementRate}
              onChange={(e) => onInputChange('fixedIncrementRate', e.target.value)}
              placeholder="0.00"
              step="0.01"
            />
          </div>
        )}
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
                    {isPropertyLease && <option value="Fixed">Fix Rate</option>}
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