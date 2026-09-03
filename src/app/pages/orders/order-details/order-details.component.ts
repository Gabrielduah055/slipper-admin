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
  private readonly route = inject(ActivatedRoute);
  private readonly orderService = inject(OrderService);
  
  order: Order | null = null;
  orderId = '';
  loading = true;
  loadError = false;
  updating = false;
  feedbackMessage = '';
  feedbackType: 'success' | 'error' = 'success';
  readonly progressSteps = ['pending', 'processing', 'shipped', 'delivered'];

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.orderId = id;
      this.fetchOrder(id);
    } else {
      this.loading = false;
    }
  }

  fetchOrder(id: string): void {
    this.loading = true;
    this.loadError = false;
    this.orderService.getOrders().subscribe({
      next: (res: {orders: Order[]}) => {
        this.order = res.orders.find((o: Order) => o._id === id) || null;
        this.loading = false;
      },
      error: (error: unknown) => {
        console.error(error);
        this.loadError = true;
        this.loading = false;
      }
    });
  }

  updateStatus(newStatus: string): void {
    if (!this.order) return;

    this.feedbackMessage = '';
    this.updating = true;
    this.orderService.updateOrderStatus(this.order._id, newStatus).subscribe({
      next: (res) => {
        if (this.order) {
          this.order = { ...this.order, status: res.order.status };
        }
        this.feedbackType = 'success';
        this.feedbackMessage = `Order status updated to ${newStatus}.`;
        this.updating = false;
      },
      error: (error: unknown) => {
        console.error('Error updating status:', error);
        this.feedbackType = 'error';
        this.feedbackMessage = 'The order status could not be updated. Please try again.';
        this.updating = false;
      }
    });
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'pending': return 'status-pending';
      case 'processing': return 'status-processing';
      case 'paid': return 'status-paid';
      case 'shipped': return 'status-shipped';
      case 'delivered': return 'status-delivered';
      case 'cancelled': return 'status-cancelled';
      default: return 'status-neutral';
    }
  }

  // Helper to determine available next steps based on current status
  get availableActions(): string[] {
    if (!this.order) return [];
    
    switch (this.order.status) {
        case 'pending': return ['processing', 'cancelled'];
        case 'paid': return ['processing', 'cancelled'];
        case 'processing': return ['shipped', 'cancelled'];
        case 'shipped': return ['delivered'];
        case 'delivered': return []; 
        case 'cancelled': return [];
        default: return [];
    }
  }

  isStepComplete(step: string): boolean {
    if (!this.order || this.order.status === 'cancelled') return false;
    const currentIndex = this.progressSteps.indexOf(this.order.status === 'paid' ? 'pending' : this.order.status);
    return this.progressSteps.indexOf(step) <= currentIndex;
  }

  isCurrentStep(step: string): boolean {
    if (!this.order) return false;
    return step === (this.order.status === 'paid' ? 'pending' : this.order.status);
  }
}
