
export enum ViewMode {
  ADMIN = 'ADMIN',
  STORE = 'STORE',
  CUSTOMER = 'CUSTOMER'
}

export interface WaitingCustomer {
  id: string;
  ticketNumber: number;
  adults: number;
  children: number;
  seatType: 'TABLE' | 'COUNTER' | 'EITHER';
  status: 'WAITING' | 'CALLED' | 'HOLD';
  arrivalTime: Date;
}

export interface AccountInfo {
  name: string;
  email: string;
  storeName: string;
  status: 'ACTIVE' | 'DISABLED';
}
