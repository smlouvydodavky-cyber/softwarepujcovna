export interface Vehicle {
  id: string;
  make: 'Opel' | 'Renault' | 'Fiat' | 'Peugeot';
  model: 'Movano' | 'Master' | 'Ducato' | 'Boxer';
  licensePlate: string;
  year: number;
  vin: string;
  stkDueDate: string; // ISO date string
  serviceHistory: ServiceRecord[];
  pricing: {
    hour4: number;
    hour12: number;
    day: number;
  };
}

export interface Customer {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  idNumber: string; // "číslo OP"
  drivingLicense: string;
}

export interface ServiceRecord {
  id: string;
  date: string; // ISO date string
  description: string;
  cost: number;
}

export interface HandoverProtocol {
  timestamp: string; // ISO date string
  mileage: number;
  fuelLevel: number; // 0, 0.25, 0.5, 0.75, 1
  notes: string;
  photos: string[]; // Array of public URLs from Supabase Storage
  signature: string; // base64 data URL of the signature image
}

export interface Rental {
  id: string;
  customerId: string;
  vehicleId: string;
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  totalPrice: number;
  status: 'upcoming' | 'active' | 'completed';
  contractDetails: string; // Simple HTML/text representation of the contract
  startMileage?: number;
  endMileage?: number;
  pickupProtocol?: HandoverProtocol;
  returnProtocol?: HandoverProtocol;
}

export interface InvoiceParty {
  name: string;
  address: string;
  idNumber?: string;
  phone?: string;
  email?: string;
  bankAccount?: string;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  id: string;
  rentalId: string;
  issueDate: string; // ISO date string
  dueDate: string; // ISO date string
  amount: number;
  status: 'paid' | 'unpaid';
  supplier: InvoiceParty;
  customer: InvoiceParty;
  items: InvoiceItem[];
  variableSymbol: string;
}

export interface Notification {
  id: number;
  message: string;
  type: 'success' | 'error';
}