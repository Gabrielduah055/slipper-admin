import { Products } from "./product_interface";
import { Customer } from "./customer.interface";

export interface PaymentInfo {
    method: string;
    status: string;
    transactionId: string;
}

export interface OrderItem {
    product: Products;
    quantity: number;
    priceAtPurchase: number;
    _id?: string;
}

export interface Order {
    _id: string;
    customer: Customer;
    items: OrderItem[];
    totalAmount: number;
    // Updated to match backend: 'processing' instead of 'confirmed'
    status: "pending" | "processing" | "shipped" | "delivered" | "cancelled" | "paid";
    paymentInfo?: PaymentInfo;
    createdAt: string;
    updatedAt: string;
    deliveryDetails?: any; 
}
