// Three synthetic Australian payslip text layouts, as pdf-parse would emit them.

/** Layout 1: classic tabular payslip, $-prefixed amounts, date-range pay period. */
export const FIXTURE_TABULAR = `
ACME LOGISTICS PTY LTD
ABN 12 345 678 901
Payslip

Employee: Jane Citizen
Employee No: 40213
Pay Period: 01/06/2026 - 14/06/2026
Payment Date: 15/06/2026

Description                     Amount
Gross Pay                       $2,884.62
PAYG Withholding                $612.00
Fuel Allowance                  $150.00
Meal Allowance                  $45.50
Superannuation (SG)             $331.73

Net Pay                         $2,468.12
`;

/** Layout 2: MYOB-style, plain amounts, "Period Ending" only, EFT net, no allowances.
 * Includes a Tax File Number line that must NOT be picked up as tax. */
export const FIXTURE_MYOB = `
Bunbury Retail Group
Pay Advice

Name: John Smith
Tax File No: 123 456 789
Period Ending: 30/06/2026
Pay Frequency: Fortnightly

Total Gross 3,200.00
Tax Withheld 750.00
Super Guarantee 368.00

EFT Amount 2,450.00
Bank: ***-*** ****4321
`;

/** Layout 4: column-split layout — labels and amounts on separate lines, columns
 * concatenated without spaces (units, 4-decimal rate, THIS PAY, YTD), gross
 * labelled "Total Earnings". Modelled on a real construction-industry payslip. */
export const FIXTURE_COLUMNAR = `
CIVIL WORKS PTY LTD
ABN 11 222 333 444
EMPLOYMENT DETAILS
Pay Frequency: Fortnightly
Pay Period: 22/06/2026 - 05/07/2026Payment Date: 08/07/2026
Total Earnings: $1,282.49Net Pay: $1,178.49
THIS PAYYTD
SALARY & WAGES
RATE
Casual Level 1 Day
25.7500$36.2600$933.70$933.70
Meal Allowance
2.0000$19.0000$38.00$38.00
Travel Allowance
4.0000$21.9400$87.76$87.76
TOTAL
$1,282.49$1,282.49
TAX
PAYG
$104.00$104.00
TOTAL
$104.00$104.00
SUPERANNUATION
SGC - Sample Super - 12345678
$112.04$112.04
TOTAL
$112.04$112.04
`;

/** Layout 3: uppercase Xero-style, written month names, travel allowance, no meals. */
export const FIXTURE_XERO = `
WESTSIDE ENGINEERING
PAYSLIP FOR PAY PERIOD 15 Jun 2026 to 28 Jun 2026

GROSS EARNINGS 4,105.77
INCOME TAX 1,022.00
TRAVEL ALLOWANCE 120.00
SUPERANNUATION 472.16

TAKE HOME PAY 3,203.77
`;
