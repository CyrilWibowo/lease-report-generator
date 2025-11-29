import React, { useState, useEffect } from 'react';
import { Lease } from '../types/Lease';
import TypeSelection from './TypeSelection';
import LeaseForm from './LeaseForm';
import './AddLeaseModal.css';

interface AddLeaseModalProps {
  onClose: () => void;
  onSave: (lease: Lease) => void;
}

const AddLeaseModal: React.FC<AddLeaseModalProps> = ({ onClose, onSave }) => {
  const [step, setStep] = useState<'select' | 'form'>('select');
  const [leaseType, setLeaseType] = useState<'Property' | 'Motor Vehicle' | null>(null);
  const [lease, setLease] = useState<Lease>({
    id: '',
    type: 'Property',
    propertyAddress: '',
    description: '',
    commencementDate: '',
    expiryDate: '',
    options: '',
    originalAnnualRent: '',
    rbaCpiRate: '',
    fixedIncrementRate: '',
    borrowingRate: '',
    incrementMethods: {},
    overrideAmounts: {},
  });
  const [errors, setErrors] = useState<{ [key: string]: boolean }>({});
  const [committedYears, setCommittedYears] = useState(0);

  useEffect(() => {
    calculateCommittedYears();
  }, [lease.commencementDate, lease.expiryDate, lease.options]);

  const calculateCommittedYears = () => {
    if (lease.commencementDate && lease.expiryDate) {
      const start = new Date(lease.commencementDate);
      const end = new Date(lease.expiryDate);
      const yearsDiff = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365));
      const optionsYears = parseInt(lease.options) || 0;
      const total = Math.floor(yearsDiff + optionsYears);
      setCommittedYears(total > 0 ? total : 0);
    } else {
      setCommittedYears(0);
    }
  };

  const handleTypeSelect = (type: 'Property' | 'Motor Vehicle') => {
    setLeaseType(type);
    setLease({ ...lease, type, id: Date.now().toString() + Math.random().toString(36).substr(2, 9) });
    setStep('form');
  };

  const handleInputChange = (field: string, value: string) => {
    setLease({ ...lease, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: false });
    }
  };

  const handleIncrementMethodChange = (year: number, value: string) => {
    const updatedMethods = { ...lease.incrementMethods, [year]: value };
    const updatedLease = { ...lease, incrementMethods: updatedMethods };

    if (value !== 'Market') {
      const updatedOverrides = { ...lease.overrideAmounts };
      delete updatedOverrides[year];
      updatedLease.overrideAmounts = updatedOverrides;
    }

    setLease(updatedLease);
  };

  const handleOverrideAmountChange = (year: number, value: string) => {
    const updatedOverrides = { ...lease.overrideAmounts, [year]: value };
    setLease({ ...lease, overrideAmounts: updatedOverrides });
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: boolean } = {};
    let isValid = true;

    const displayNameField = lease.type === 'Property' ? 'propertyAddress' : 'description';
    if (!lease[displayNameField]?.trim()) {
      newErrors[displayNameField] = true;
      isValid = false;
    }
    if (!lease.commencementDate) {
      newErrors.commencementDate = true;
      isValid = false;
    }
    if (!lease.expiryDate) {
      newErrors.expiryDate = true;
      isValid = false;
    }
    if (!lease.options.trim()) {
      newErrors.options = true;
      isValid = false;
    }
    if (!lease.originalAnnualRent.trim()) {
      newErrors.originalAnnualRent = true;
      isValid = false;
    }
    if (!lease.rbaCpiRate.trim()) {
      newErrors.rbaCpiRate = true;
      isValid = false;
    }
    if (!lease.fixedIncrementRate.trim()) {
      newErrors.fixedIncrementRate = true;
      isValid = false;
    }
    if (!lease.borrowingRate.trim()) {
      newErrors.borrowingRate = true;
      isValid = false;
    }

    if (committedYears > 1) {
      for (let year = 2; year <= committedYears; year++) {
        if (!lease.incrementMethods[year]) {
          newErrors[`incrementMethod_${year}`] = true;
          isValid = false;
        }
        if (lease.incrementMethods[year] === 'Market' && !lease.overrideAmounts[year]?.trim()) {
          newErrors[`overrideAmount_${year}`] = true;
          isValid = false;
        }
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSave(lease);
    } else {
      alert('Please fill in all required fields');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {step === 'select' ? (
          <TypeSelection onTypeSelect={handleTypeSelect} onClose={onClose} />
        ) : (
          <LeaseForm
            lease={lease}
            leaseType={leaseType!}
            errors={errors}
            committedYears={committedYears}
            onInputChange={handleInputChange}
            onIncrementMethodChange={handleIncrementMethodChange}
            onOverrideAmountChange={handleOverrideAmountChange}
            onSubmit={handleSubmit}
            onClose={onClose}
          />
        )}
      </div>
    </div>
  );
};

export default AddLeaseModal;