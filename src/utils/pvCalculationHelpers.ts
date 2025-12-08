import { PaymentRow } from './excelHelper';
import { normalizeDate } from './helper';

export interface CashFlowRow {
  paymentDate: Date;
  baseRent: number;
  other: string;
  parking: string;
  totalCashFlows: number;
  leaseComponent: number;
}

export interface RightOfUseAssetRow {
  date: string;
  period: number;
  assetBeginning: number;
  depreciation: number;
  assetEnding: number;
}

export interface LeaseLiabilityRow {
  period: string;
  liabilityBeginning: number;
  payment: number;
  interestExpense: number;
  liabilityEnding: number;
}

export interface LeaseLiabilitySummary {
  shortTerm: number;
  longTerm: number;
  total: number;
}

export interface LeasePaymentsDueRow {
  period: string;
  leasePayments: number;
  interest: number;
  npv: number;
}

export interface JournalRow {
  col1: string;
  col2: string;
  col3: number | string;
}

export const calculatePresentValue = (
  cashFlows: number[],
  monthlyRate: number,
  paymentTiming: string
): number => {
  let npv = 0;

  if (paymentTiming === 'Beginning') {
    // First payment is at time 0 (not discounted)
    npv = cashFlows[0];
    // Remaining payments discounted from period 1 onwards
    for (let i = 1; i < cashFlows.length; i++) {
      npv += cashFlows[i] / Math.pow(1 + monthlyRate, i);
    }
  } else {
    // All payments discounted from period 1 onwards
    for (let i = 0; i < cashFlows.length; i++) {
      npv += cashFlows[i] / Math.pow(1 + monthlyRate, i + 1);
    }
  }

  return Math.round(npv * 100) / 100;
};

export const generateCashFlowsOfFutureLeasePayment = (
  filteredRows: PaymentRow[],
  other: number,
  parking: number,
  allocationToLeaseComponent: number
): CashFlowRow[] => {
  return filteredRows.map(row => {
    const baseRent = row.amount;
    const totalCashFlows = baseRent + other + parking;
    const leaseComponent = totalCashFlows * allocationToLeaseComponent;

    return {
      paymentDate: new Date(row.paymentDate),
      baseRent,
      other: '-',
      parking: '-',
      totalCashFlows,
      leaseComponent
    };
  });
};

export const generateRightOfUseAsset = (
  filteredRows: PaymentRow[],
  presentValue: number,
  cashFlowRows: CashFlowRow[]
): RightOfUseAssetRow[] => {
  const rows: RightOfUseAssetRow[] = [];

  // Count non-zero base rent rows for depreciation calculation
  const nonZeroBaseRentCount = cashFlowRows.filter(cf => cf.baseRent > 0).length;

  let previousDepreciation = 0;

  filteredRows.forEach((row, index) => {
    const period = index + 1;

    // Asset Beginning: first row is present value, subsequent rows are previous asset ending
    const assetBeginning = index === 0
      ? presentValue
      : rows[index - 1].assetEnding;

    // Calculate Depreciation (negative value)
    let depreciation: number;
    if (index === 0) {
      // First row: -J10/COUNTIF($B$10:$B$179,">0")
      depreciation = (-assetBeginning / nonZeroBaseRentCount);
    } else {
      // Subsequent rows: IF(I11>=COUNTIF($B$10:$B$179,">0"),-L10,$K$10)
      if (period >= nonZeroBaseRentCount) {
        depreciation = (-rows[index - 1].assetEnding);
      } else {
        depreciation = previousDepreciation;
      }
    }

    previousDepreciation = depreciation;

    // Asset Ending: Asset Beginning + Depreciation (depreciation is negative)
    const assetEnding = assetBeginning + depreciation;

    rows.push({
      date: formatDateShort(row.paymentDate),
      period,
      assetBeginning,
      depreciation,
      assetEnding
    });
  });

  return rows;
};

export const generateLeaseLiability = (
  filteredRows: PaymentRow[],
  presentValue: number,
  cashFlowRows: CashFlowRow[],
  borrowingRate: number,
  paymentTiming: string
): LeaseLiabilityRow[] => {
  const rows: LeaseLiabilityRow[] = [];

  filteredRows.forEach((row, index) => {
    const period = formatDateShort(row.paymentDate);

    // Liability Beginning: first row is present value, subsequent rows are previous liability ending
    const liabilityBeginning = index === 0
      ? presentValue
      : rows[index - 1].liabilityEnding;

    // Payment: Total Cash Flows from corresponding row (negative value)
    const payment = (-cashFlowRows[index].totalCashFlows);

    // Interest Expense: IF($F$4="Beginning",SUM(O10:P10)*$F$3/12,O10*$F$3/12)
    let interestExpense: number;
    if (paymentTiming === 'Beginning') {
      interestExpense = (liabilityBeginning + payment) * borrowingRate / 12;
    } else {
      interestExpense = (liabilityBeginning * borrowingRate) / 12;
    }

    // Liability Ending: Liability Beginning + Payment + Interest Expense (payment is negative)
    const liabilityEnding = liabilityBeginning + payment + interestExpense;

    rows.push({
      period,
      liabilityBeginning,
      payment,
      interestExpense,
      liabilityEnding
    });
  });

  return rows;
};

export const calculateLeaseLiabilitySummary = (
  leaseLiabilityRows: LeaseLiabilityRow[],
  allPaymentRows: PaymentRow[],
  startDate: Date,
  endDate: Date
): LeaseLiabilitySummary => {
  let shortTerm = 0;
  let longTerm = 0;

  // Filter rows within the date range
  const filteredIndices = allPaymentRows
    .map((row, index) => ({ row, index }))
    .filter(({ row }) => {
      const paymentDate = normalizeDate(new Date(row.paymentDate));
      const normalizedStart = normalizeDate(startDate);
      const normalizedEnd = normalizeDate(endDate);

      return paymentDate >= normalizedStart && paymentDate <= normalizedEnd;
    });

  // Calculate short-term: sum of payment + interest expense for the period
  filteredIndices.forEach(({ index }) => {
    const liability = leaseLiabilityRows[index];
    if (liability) {
      shortTerm += liability.payment + liability.interestExpense;
    }
  });

  // Calculate long-term: liability ending at the end date
  const endDateIndex = allPaymentRows.findIndex(row => {
    const paymentDate = new Date(row.paymentDate);
    return paymentDate.getMonth() === endDate.getMonth() &&
           paymentDate.getFullYear() === endDate.getFullYear();
  });

  if (endDateIndex !== -1 && leaseLiabilityRows[endDateIndex]) {
    longTerm = leaseLiabilityRows[endDateIndex].liabilityEnding;
  }

  return {
    shortTerm: Math.round(shortTerm * 100) / 100,
    longTerm: Math.round(longTerm * 100) / 100,
    total: Math.round((shortTerm + longTerm) * 100) / 100
  };
};

export const calculatePVInterestAccretion = (
  leaseLiabilityRows: LeaseLiabilityRow[],
  allPaymentRows: PaymentRow[],
  startDate: Date
): number => {
  let total = 0;

  // Sum interest expense from startDate to end
  allPaymentRows.forEach((row, index) => {
    const paymentDate = normalizeDate(new Date(row.paymentDate));
    const normalizedStart = normalizeDate(startDate);
    if (paymentDate >= normalizedStart && leaseLiabilityRows[index]) {
      total += leaseLiabilityRows[index].interestExpense;
    }
  });

  return Math.round(total * 100) / 100;
};

export const calculateLeasePaymentsDue = (
  leaseLiabilityRows: LeaseLiabilityRow[],
  allPaymentRows: PaymentRow[],
  closingDate: Date
): LeasePaymentsDueRow[] => {
  const rows: LeasePaymentsDueRow[] = [];

  const closingYear = closingDate.getFullYear();

  // Define year ranges
  const yearRanges = [
    { period: '< 1 Year', startYear: closingYear + 1, endYear: closingYear + 1 },
    { period: '1-2 Years', startYear: closingYear + 2, endYear: closingYear + 2 },
    { period: '2-3 Years', startYear: closingYear + 3, endYear: closingYear + 3 },
    { period: '3-4 Years', startYear: closingYear + 4, endYear: closingYear + 4 },
    { period: '4-5 Years', startYear: closingYear + 5, endYear: closingYear + 5 },
    { period: '> 5 Years', startYear: closingYear + 6, endYear: Infinity }
  ];

  yearRanges.forEach(range => {
    let leasePayments = 0;
    let interest = 0;

    allPaymentRows.forEach((row, index) => {
      const paymentDate = normalizeDate(new Date(row.paymentDate));
      const paymentYear = paymentDate.getFullYear();

      if (paymentYear >= range.startYear && paymentYear <= range.endYear) {
        if (leaseLiabilityRows[index]) {
          // Payments are negative, so take absolute value
          leasePayments += Math.abs(leaseLiabilityRows[index].payment);
          interest += leaseLiabilityRows[index].interestExpense;
        }
      }
    });

    const npv = leasePayments - interest;

    rows.push({
      period: range.period,
      leasePayments: Math.round(leasePayments * 100) / 100,
      interest: Math.round(interest * 100) / 100,
      npv: Math.round(npv * 100) / 100
    });
  });

  // Calculate totals
  const totalLeasePayments = rows.reduce((sum, row) => sum + row.leasePayments, 0);
  const totalInterest = rows.reduce((sum, row) => sum + row.interest, 0);
  const totalNPV = rows.reduce((sum, row) => sum + row.npv, 0);

  rows.push({
    period: 'Total',
    leasePayments: Math.round(totalLeasePayments * 100) / 100,
    interest: Math.round(totalInterest * 100) / 100,
    npv: Math.round(totalNPV * 100) / 100
  });

  return rows;
};

export const generateJournalTable = (
  presentValue: number,
  leaseLiabilityRows: LeaseLiabilityRow[],
  rightOfUseAssetRows: RightOfUseAssetRow[],
  allPaymentRows: PaymentRow[],
  openingDate: Date,
  closingDate: Date,
  expiryDate: Date,
  openingBalanceLeaseLiabilityNonCurrent: number
): JournalRow[] => {
  const rows: JournalRow[] = [];

  const normalizedOpening = normalizeDate(openingDate);
  const normalizedClosing = normalizeDate(closingDate);
  const normalizedExpiry = normalizeDate(expiryDate);

  // Right to Use The Assets - Lease Liability - Current
  // Calculate row 4: sum of all payments before opening date (not including)
  let paymentsBeforeOpening = 0;
  allPaymentRows.forEach((row, index) => {
    const paymentDate = normalizeDate(new Date(row.paymentDate));
    if (paymentDate < normalizedOpening && leaseLiabilityRows[index]) {
      paymentsBeforeOpening += leaseLiabilityRows[index].payment + leaseLiabilityRows[index].interestExpense;
    }
  });

  // Right to Use The Assets - Lease Liability - Non Current
  // Calculate row 5: -(row3 + row4)
  const row5Value = -(presentValue + paymentsBeforeOpening);

  // Lease Liability - Non Current
  // Calculate row 9: =IF(H129=0,0,IF($F$6>='Lease Payments'!$C$6,-$H$129,-SUM($P$10:$Q$17)))
  // If opening balance Lease Liability Non Current is 0, row9 = 0
  // Else if closing date >= expiry date, row9 = -openingBalanceLeaseLiabilityNonCurrent
  // Else row9 = -SUM(payment + interest expense) for the period between opening and closing dates
  let row9Value: number;
  if (openingBalanceLeaseLiabilityNonCurrent === 0) {
    row9Value = 0;
  } else if (normalizedClosing >= normalizedExpiry) {
    row9Value = -openingBalanceLeaseLiabilityNonCurrent;
  } else {
    let openingToClosingSum = 0;
    allPaymentRows.forEach((row, index) => {
      const paymentDate = normalizeDate(new Date(row.paymentDate));
      if (paymentDate >= normalizedOpening && paymentDate <= normalizedClosing && leaseLiabilityRows[index]) {
        openingToClosingSum += leaseLiabilityRows[index].payment + leaseLiabilityRows[index].interestExpense;
      }
    });
    row9Value = -openingToClosingSum;
  }

  // Lease Liability - Current
  // Calculate row 10: sum(payment + interest expense between opening and closing) * -1
  let openingToClosingTotal = 0;
  allPaymentRows.forEach((row, index) => {
    const paymentDate = normalizeDate(new Date(row.paymentDate));
    if (paymentDate >= normalizedOpening && paymentDate <= normalizedClosing && leaseLiabilityRows[index]) {
      openingToClosingTotal += leaseLiabilityRows[index].payment + leaseLiabilityRows[index].interestExpense;
    }
  });
  const row10Value = -(openingToClosingTotal + row9Value);

  // Deprication Expense
  // Calculate row 11: abs(sum of all depreciation between opening and closing inclusive)
  let depreciationTotal = 0;
  allPaymentRows.forEach((row, index) => {
    const paymentDate = normalizeDate(new Date(row.paymentDate));
    if (paymentDate >= normalizedOpening && paymentDate <= normalizedClosing && rightOfUseAssetRows[index]) {
      depreciationTotal += rightOfUseAssetRows[index].depreciation;
    }
  });
  const row11Value = Math.abs(depreciationTotal);

  // Interest Expense Rent
  // Calculate row 12: sum of interest expense between opening and closing inclusive
  let interestExpenseTotal = 0;
  allPaymentRows.forEach((row, index) => {
    const paymentDate = normalizeDate(new Date(row.paymentDate));
    if (paymentDate >= normalizedOpening && paymentDate <= normalizedClosing && leaseLiabilityRows[index]) {
      interestExpenseTotal += leaseLiabilityRows[index].interestExpense;
    }
  });

  // Acc.Depr Right to Use the Assets
  // Calculate row 13: same as row 10 but not abs (keep negative)
  const row13Value = -row11Value;

  // Rent Expense
  // Calculate row 14: sum of rows 9-13
  const row14Value = row9Value + row10Value + row11Value + interestExpenseTotal + row13Value;

  // Build the 15 rows
  rows.push({ col1: '', col2: '', col3: '' }); // Row 1
  rows.push({ col1: '', col2: '', col3: '' }); // Row 2
  rows.push({ col1: '164000', col2: 'Right to Use the Assets', col3: presentValue }); // Row 3
  rows.push({ col1: '22005', col2: '   Lease Liability - Current', col3: paymentsBeforeOpening }); // Row 4
  rows.push({ col1: '22010', col2: '   Lease Liability - Non-Current', col3: row5Value }); // Row 5
  rows.push({ col1: '', col2: '', col3: '' }); // Row 6
  rows.push({ col1: '', col2: '', col3: '' }); // Row 7
  rows.push({ col1: '', col2: '', col3: '' }); // Row 8
  rows.push({ col1: '22010', col2: 'Lease Liability - Non-Current', col3: row9Value }); // Row 9
  rows.push({ col1: '22005', col2: 'Lease Liability - Current', col3: row10Value }); // Row 10
  rows.push({ col1: '60080', col2: 'Depreciation Expense', col3: row11Value }); // Row 11
  rows.push({ col1: '60275', col2: 'Interest Expense Rent', col3: interestExpenseTotal }); // Row 12
  rows.push({ col1: '16405', col2: '   Acc.Depr Right to Use Assets', col3: row13Value }); // Row 13
  rows.push({ col1: '60270', col2: '   Rent Expense', col3: row14Value }); // Row 14
  rows.push({ col1: '', col2: `(Journal at ${formatDateToDateShort(closingDate)})`, col3: '' }); // Row 15

  return rows;
};

export const getNextYearEnd = (date: Date): Date => {
  const nextYear = new Date(date);
  nextYear.setFullYear(nextYear.getFullYear() + 1);
  nextYear.setMonth(11); // December
  nextYear.setDate(31);
  return nextYear;
};

export const formatDateShort = (date: Date): string => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[date.getMonth()];
  const year = String(date.getFullYear()).slice(-2);
  return `${month}-${year}`;
};

const formatDateToDateShort = (date: Date): string => {
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
};