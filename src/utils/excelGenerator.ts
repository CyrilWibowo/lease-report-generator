import * as XLSX from 'xlsx';
import { PropertyLease } from '../types/Lease';
import { generateLeasePayments } from './leasePaymentsSheetGenerator';
import { generatePVCalculation } from './PVCalculationSheetGenerator';

export const generateExcelFromLeases = (lease: PropertyLease) => {
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, generateLeasePayments(lease), "Lease Payements");
  XLSX.utils.book_append_sheet(workbook, generatePVCalculation(lease), "PV Calculation");

  XLSX.writeFile(workbook, `${lease.propertyAddress}.xlsx`);
};