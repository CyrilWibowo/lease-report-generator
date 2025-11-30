// components/AddLeaseModal.tsx
import React, { useState, useEffect } from 'react';
import { Lease, PropertyLease, MotorVehicleLease } from '../types/Lease';
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
  const [lease, setLease] = useState<Lease | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: boolean }>({});
  const [committedYears, setCommittedYears] = useState(0);

  useEffect(() => {
    if (lease) {
      calculateCommittedYears();
    }
  }, [lease]);

  const calculateCommittedYears = () => {
    if (!lease) return;

    if (lease.type === 'Property') {
      const propertyLease = lease as PropertyLease;
      if (propertyLease.commencementDate && propertyLease.expiryDate) {
        const start = new Date(propertyLease.commencementDate);
        const end = new Date(propertyLease.expiryDate);
        const yearsDiff = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365));
        const optionsYears = parseInt(propertyLease.options) || 0;
        const total = Math.floor(yearsDiff + optionsYears);
        setCommittedYears(total > 0 ? total : 0);
      } else {
        setCommittedYears(0);
      }
    } else {
      const mvLease = lease as MotorVehicleLease;
      if (mvLease.deliveryDate && mvLease.expiryDate) {
        const start = new Date(mvLease.deliveryDate);
        const end = new Date(mvLease.expiryDate);
        const yearsDiff = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365));
        const total = Math.floor(yearsDiff);
        setCommittedYears(total > 0 ? total : 0);
      } else {
        setCommittedYears(0);
      }
    }
  };

  const handleTypeSelect = (type: 'Property' | 'Motor Vehicle') => {
    setLeaseType(type);
    const baseId = Date.now().toString() + Math.random().toString(36).substr(2, 9);

    if (type === 'Property') {
      setLease({
        id: baseId,
        type: 'Property',
        lessor: '',
        propertyAddress: '',
        commencementDate: '',
        expiryDate: '',
        options: '',
        annualRent: '',
        rbaCpiRate: '',
        fixedIncrementRate: '',
        borrowingRate: '',
        incrementMethods: {},
        overrideAmounts: {},
      } as PropertyLease);
    } else {
      setLease({
        id: baseId,
        type: 'Motor Vehicle',
        lessor: '',
        entityName: '',
        description: '',
        vinSerialNo: '',
        regoNo: '',
        deliveryDate: '',
        expiryDate: '',
        annualRent: '',
        rbaCpiRate: '',
        borrowingRate: '',
        incrementMethods: {},
        overrideAmounts: {},
      } as MotorVehicleLease);
    }
    setStep('form');
  };

  const handleInputChange = (field: string, value: string) => {
    if (!lease) return;
    setLease({ ...lease, [field]: value } as Lease);
    if (errors[field]) {
      setErrors({ ...errors, [field]: false });
    }
  };

  const handleIncrementMethodChange = (year: number, value: string) => {
    if (!lease) return;
    const updatedMethods = { ...lease.incrementMethods, [year]: value };
    const updatedLease = { ...lease, incrementMethods: updatedMethods };

    if (value !== 'Market') {
      const updatedOverrides = { ...lease.overrideAmounts };
      delete updatedOverrides[year];
      updatedLease.overrideAmounts = updatedOverrides;
    }

    setLease(updatedLease as Lease);
  };

  const handleOverrideAmountChange = (year: number, value: string) => {
    if (!lease) return;
    const updatedOverrides = { ...lease.overrideAmounts, [year]: value };
    setLease({ ...lease, overrideAmounts: updatedOverrides } as Lease);
  };

  const validateForm = (): boolean => {
    if (!lease) return false;

    const newErrors: { [key: string]: boolean } = {};
    let isValid = true;

    // Common validations
    if (!lease.lessor?.trim()) {
      newErrors.lessor = true;
      isValid = false;
    }
    if (!lease.annualRent.trim()) {
      newErrors.annualRent = true;
      isValid = false;
    }
    if (!lease.rbaCpiRate.trim()) {
      newErrors.rbaCpiRate = true;
      isValid = false;
    }
    if (!lease.borrowingRate.trim()) {
      newErrors.borrowingRate = true;
      isValid = false;
    }

    if (lease.type === 'Property') {
      const propertyLease = lease as PropertyLease;
      if (!propertyLease.propertyAddress?.trim()) {
        newErrors.propertyAddress = true;
        isValid = false;
      }
      if (!propertyLease.commencementDate) {
        newErrors.commencementDate = true;
        isValid = false;
      }
      if (!propertyLease.expiryDate) {
        newErrors.expiryDate = true;
        isValid = false;
      }
      if (!propertyLease.options.trim()) {
        newErrors.options = true;
        isValid = false;
      }
      if (!propertyLease.fixedIncrementRate.trim()) {
        newErrors.fixedIncrementRate = true;
        isValid = false;
      }
    } else {
      const mvLease = lease as MotorVehicleLease;
      if (!mvLease.entityName?.trim()) {
        newErrors.entityName = true;
        isValid = false;
      }
      if (!mvLease.description?.trim()) {
        newErrors.description = true;
        isValid = false;
      }
      if (!mvLease.vinSerialNo?.trim()) {
        newErrors.vinSerialNo = true;
        isValid = false;
      }
      if (!mvLease.regoNo?.trim()) {
        newErrors.regoNo = true;
        isValid = false;
      }
      if (!mvLease.deliveryDate) {
        newErrors.deliveryDate = true;
        isValid = false;
      }
      if (!mvLease.expiryDate) {
        newErrors.expiryDate = true;
        isValid = false;
      }
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
    if (validateForm() && lease) {
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
          lease && (
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
          )
        )}
      </div>
    </div>
  );
};

export default AddLeaseModal;