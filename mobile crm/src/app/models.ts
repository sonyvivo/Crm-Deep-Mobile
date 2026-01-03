export interface Purchase {
  id: string;
  date: string;
  supplier: string;
  deviceBrand: string;
  deviceModel?: string;
  partName: string;
  partNameOther?: string;
  unitPrice: number;
  totalAmount: number;
  notes?: string;
}

export interface Sale {
  id: string;
  date: string;
  customer: string;
  customerMobile?: string;
  deviceBrand: string;
  deviceModel?: string;
  problem?: string;
  partName: string;
  partNameOther?: string;
  unitPrice: number;
  purchaseCost: number;
  profit: number;
  totalAmount: number;
  notes?: string;
  paymentMode: 'Cash' | 'Online' | 'Pending';
  pendingAmount?: number;
}

export interface Expense {
  id: string;
  date: string;
  category: string;
  description: string;
  vendor?: string;
  amount: number;
  paymentMode: 'Cash' | 'Online' | 'Card' | 'Cheque';
  receipt?: 'No' | 'Yes' | 'Digital' | 'Bill';
  receiptNumber?: string;
  notes?: string;
}

export interface Customer {
  id: string;
  name: string;
  mobile?: string;
  address?: string;
  notes?: string;
}

export interface JobSheet {
  id: string; // Ticket ID (e.g., DM-1001)
  date: string; // ISO String
  status: 'Pending' | 'Diagnosing' | 'Waiting for Approval' | 'Ready' | 'Delivered' | 'Cancelled';

  // Customer Details
  customerName: string;
  customerMobile: string;
  customerAltMobile?: string;
  customerAddress?: string;

  // Service Details
  serviceType?: 'Walk-in' | 'On-Site' | 'Pickup';
  jobType?: 'New' | 'Warranty' | 'AMC';
  priority?: 'Urgent Repair' | 'Regular' | 'Moderate';

  // Device Info
  deviceBrand: string;
  deviceModel: string;
  imei: string;
  color?: string;
  lockType?: 'Pattern' | 'PIN/Password' | 'None';
  lockCode?: string; // Pattern as sequence (1-2-3), PIN as text

  // Problem
  faultCategory: string[];
  customerRemark?: string;
  technicianNote?: string;

  // Physical Condition
  scratches?: boolean;
  dents?: boolean;
  backGlassBroken?: boolean;
  bentFrame?: boolean;
  accessoriesRec?: string[]; // e.g. ['SIM Tray', 'Back Cover']



  // Financials
  estimatedCost: number;
  advancePayment: number;
  pendingAmount: number; // calculated

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceItem {
  type: 'service' | 'part';
  description: string;
  quantity: number;
  price: number;
  warranty: string;
  total: number;
}

export interface Invoice {
  id: string; // INV-YYYY-XXXX
  date: string; // ISO string

  // Customer
  customerName: string;
  customerMobile: string;
  customerAddress?: string;

  // Device
  deviceType: string;
  deviceBrand: string;
  deviceModel: string;
  deviceImei: string;
  deviceIssues: string;
  deviceAccessories: string;

  // Items
  items: InvoiceItem[];

  // Financials
  subtotal: number;
  taxPercent: number;
  discount: number;
  totalAmount: number;

  // Payment
  paymentStatus: 'Paid' | 'Cash' | 'Google Pay' | 'Pending';
  amountPaid: number;
  balanceDue: number;

  // Notes
  warrantyInfo: string;
  technicianNotes?: string;
}
