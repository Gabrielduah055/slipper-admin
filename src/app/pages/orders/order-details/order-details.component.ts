import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { OrderService } from '../../../service/order.service';
import { Order } from '../../../interface/order.interface';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-order-details',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './order-details.component.html',
  styleUrl: './order-details.component.css'
})
export class OrderDetailsComponent implements OnInit {
  route = inject(ActivatedRoute);
  orderService = inject(OrderService);
  
  order: Order | null = null;
  loading = true;
  updating = false;

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.fetchOrder(id);
    }
  }

  fetchOrder(id: string) {
    this.orderService.getOrders().subscribe({
      next: (res: {orders: Order[]}) => {
        this.order = res.orders.find((o: Order) => o._id === id) || null;
        this.loading = false;
      },
      error: (err: any) => {
        console.error(err);
        this.loading = false;
      }
    });
  }

  updateStatus(newStatus: string) {
    if (!this.order) return;
    
    this.updating = true;
    this.orderService.updateOrderStatus(this.order._id, newStatus).subscribe({
      next: (res) => {
        if (this.order) {
            this.order.status = res.order.status as any;
            
            // Notification simulation
            if (newStatus === 'shipped') {
                alert(`Order marked as SHIPPED.\n\nSimulated: SMS sent to customer ${this.order.customer.phoneNumber}: "Your order #${this.order._id.slice(-6)} has been shipped!"`);
            } else if (newStatus === 'delivered') {
                 alert(`Order marked as DELIVERED.\n\nSimulated: SMS sent to customer ${this.order.customer.phoneNumber}: "Your order #${this.order._id.slice(-6)} has been delivered!"`);
            }
        }
        this.updating = false;
      },
      error: (err) => {
        console.error('Error updating status:', err);
        alert('Failed to update status');
        this.updating = false;
      }
    });
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800'; // Changed from confirmed
      case 'shipped': return 'bg-indigo-100 text-indigo-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  // Helper to determine available next steps based on current status
  get availableActions(): string[] {
    if (!this.order) return [];
    
    switch (this.order.status) {
        case 'pending': return ['processing', 'cancelled']; // Changed from confirmed
        case 'processing': return ['shipped', 'cancelled']; // Changed from confirmed
        case 'shipped': return ['delivered'];
        case 'delivered': return []; 
        case 'cancelled': return [];
        default: return [];
    }
  }
}
