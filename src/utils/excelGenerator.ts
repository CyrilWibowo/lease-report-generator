import * as XLSX from 'xlsx';
import { PropertyLease } from '../types/Lease';
import { generatePaymentRows } from './excelHelper';
import { generateLeasePayments } from './leasePaymentsSheetGenerator';

export const generateExcelFromLeases = (lease: PropertyLease) => {
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook, generateLeasePayments(lease, generatePaymentRows(lease)),
    "Lease Payements"
  );

  XLSX.writeFile(workbook, `${lease.propertyAddress}.xlsx`);
};