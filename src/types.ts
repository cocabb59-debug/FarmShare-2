export enum Role {
  USER = 'user',
  OWNER = 'owner',
  ADMIN = 'admin',
}

export enum MachineStatus {
  AVAILABLE = 'available',
  MAINTENANCE = 'maintenance',
  RENTED = 'rented',
}

export enum BookingStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PAID = 'paid',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  REFUNDED = 'refunded',
}

export interface UserProfile {
  id: string; // auth uid
  name: string;
  email: string;
  phone: string;
  address: string;
  role: Role;
  createdAt: string;
}

export interface Machine {
  id: string;
  ownerId: string;
  ownerName: string;
  title: string;
  category: string;
  manufacturer: string;
  model: string;
  year: number;
  hourlyPrice: number;
  dailyPrice: number;
  weeklyPrice: number;
  deposit: number;
  description: string;
  location: string;
  status: MachineStatus;
  imageUrls?: string[];
  createdAt: string;
}

export interface Booking {
  id: string;
  machineId: string;
  machineTitle: string;
  machineImageUrl?: string;
  ownerId: string;
  renterId: string;
  renterName: string;
  renterPhone?: string;
  renterAddress?: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  status: BookingStatus;
  createdAt: string;
}

export interface Payment {
  id: string;
  bookingId: string;
  amount: number;
  paymentMethod: string;
  status: PaymentStatus;
  createdAt: string;
}

export interface Review {
  id: string;
  bookingId: string;
  machineId: string;
  userId: string;
  userName: string;
  rating: number; // 1 to 5
  content: string;
  createdAt: string;
}

export interface ChatRoom {
  id: string;
  renterId: string;
  ownerId: string;
  machineId: string;
  machineTitle: string;
  lastMessage: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  message: string;
  createdAt: string;
}
