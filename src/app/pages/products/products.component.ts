import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductsService } from '../../service/products.service';
import { Products } from '../../interface/product_interface';

@Component({
    selector: 'app-products',
    standalone: true,
    imports: [CommonModule, RouterLink, FormsModule],
    templateUrl: './products.component.html',
    styleUrl: './products.component.css'
})
export class ProductsComponent implements OnInit {
  private productService = inject(ProductsService);
  private router = inject(Router)

  allProducts: Products[] = [];
  filteredProducts: Products[] = [];
  categories: string[] = [];
  isLoading = false;

  // Filter states
  searchTerm: string = '';
  selectedCategory: string = 'All Categories';
  selectedStatus: string = 'Any Status';
  selectedSort: string = 'Sort';

  ngOnInit(): void {
    this.loadProducts();
    this.loadCategories();
  }

  loadProducts() {
    this.isLoading = true;
    this.productService.getProducts().subscribe({
      next: (products) => {
        this.allProducts = products;
        this.applyFilters();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading products:', err);
        this.isLoading = false;
      }
    });
  }

  loadCategories() {
    this.productService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
      },
      error: (err) => {
        console.error('Error loading categories:', err);
      }
    });
  }

  applyFilters() {
    let result = [...this.allProducts];

    // 1. Search Filter
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(p => 
        p.productName.toLowerCase().includes(term) || 
        p.category.toLowerCase().includes(term)
      );
    }

    // 2. Category Filter
    if (this.selectedCategory !== 'All Categories') {
      result = result.filter(p => p.category === this.selectedCategory);
    }

    // 3. Status Filter
    if (this.selectedStatus !== 'Any Status') {
      switch (this.selectedStatus) {
        case 'In Stock':
          result = result.filter(p => p.productStock > 0);
          break;
        case 'Out of Stock':
          result = result.filter(p => p.productStock === 0);
          break;
        case 'Low Stock':
          result = result.filter(p => p.productStock > 0 && p.productStock <= 5);
          break;
      }
    }

    // 4. Sorting
    if (this.selectedSort !== 'Sort') {
      switch (this.selectedSort) {
        case 'Price: Low to High':
          result.sort((a, b) => a.productPrice - b.productPrice);
          break;
        case 'Price: High to Low':
          result.sort((a, b) => b.productPrice - a.productPrice);
          break;
        case 'Name: A to Z':
          result.sort((a, b) => a.productName.localeCompare(b.productName));
          break;
        case 'Name: Z to A':
          result.sort((a, b) => b.productName.localeCompare(a.productName));
          break;
      }
    }

    this.filteredProducts = result;
  }

  deleteProduct(id: string) {
    if (confirm('Are you sure you want to delete this product?')) {
      this.productService.deleteProduct(id).subscribe({
        next: () => {
          this.loadProducts();
        },
        error: (err) => {
          console.error('Error deleting product:', err);
          alert('Failed to delete product')
        }
      })
    }
  }

  onFilterChange() {
    this.applyFilters();
  }
}
