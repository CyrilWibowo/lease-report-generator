import { PropertyLease } from '../types/Lease';

export interface PaymentRow {
  payment: number;
  leaseYear: number;
  paymentDate: Date;
  amount: number;
  note: string;
}

export const calculateXNPV = (lease: PropertyLease, rows: PaymentRow[]): number => {
  const firstDate = rows[0].paymentDate;
  const rate = parseFloat(lease.borrowingRate) / 100;
  let xnpv = 0;

  rows.forEach((row, i) => {
    const daysDiff = (Date.UTC(row.paymentDate.getFullYear(), row.paymentDate.getMonth(), row.paymentDate.getDate()) -
                  Date.UTC(firstDate.getFullYear(), firstDate.getMonth(), firstDate.getDate())) /
                 (1000 * 60 * 60 * 24);
    const yearsDiff = daysDiff / 365;
    xnpv += row.amount / Math.pow(1 + rate, yearsDiff);
  });

  return xnpv
};

export const generatePaymentRows = (lease: PropertyLease): PaymentRow[] => {
  const rows: PaymentRow[] = [];

  const commencementDate = new Date(lease.commencementDate);
  const expiryDate = new Date(lease.expiryDate);
  const optionsYears = parseInt(lease.options) || 0;

  // Calculate final date (expiry + options)
  const finalDate = new Date(expiryDate);
  finalDate.setFullYear(finalDate.getFullYear() + optionsYears);

  const originalMonthlyPayment = Math.round((parseFloat(lease.annualRent) / 12) * 100) / 100;
  console.log(originalMonthlyPayment);
  let currentAmount = originalMonthlyPayment;
  let currentDate = new Date(commencementDate);

  // Set to first day of month
  currentDate.setDate(1);

  let paymentCounter = 1;
  let leaseYear = 1;
  let monthsInCurrentYear = 0;

  // Calculate increment methods for each year
  const incrementMethods: { [year: number]: string } = {};
  Object.keys(lease.incrementMethods).forEach(yearStr => {
    incrementMethods[parseInt(yearStr)] = lease.incrementMethods[parseInt(yearStr)];
  });

  while (currentDate <= finalDate) {
    let note = '';

    // Check if we're starting a new lease year (every 12 months)
    if (monthsInCurrentYear === 12) {
      leaseYear++;
      monthsInCurrentYear = 0;

      // Apply increment method for this year
      const incrementMethod = incrementMethods[leaseYear];

      if (incrementMethod === 'Fixed') {
        const fixedRate = parseFloat(lease.fixedIncrementRate) / 100;
        currentAmount = currentAmount * (1 + fixedRate);
        note = `Fixed Increment Rate`;
      } else if (incrementMethod === 'CPI') {
        const cpiRate = parseFloat(lease.rbaCpiRate) / 100;
        currentAmount = currentAmount * (1 + cpiRate);
        note = `RBA CPI Rate`;
      } else if (incrementMethod === 'Market') {
        const yearNum = leaseYear;
        currentAmount = parseFloat(lease.overrideAmounts[yearNum] || '0');
        note = `Market Review`;
      }
    }

    rows.push({
      payment: paymentCounter,
      leaseYear: leaseYear,
      paymentDate: new Date(currentDate),
      amount: currentAmount,
      note: note
    });

    // Move to next month
    currentDate.setMonth(currentDate.getMonth() + 1);
    paymentCounter++;
    monthsInCurrentYear++;
  }

  return rows;
};