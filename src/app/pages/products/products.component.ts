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
  loadError = false;
  currentPage = 1;
  readonly pageSize = 8;

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
    this.loadError = false;
    this.productService.getProducts().subscribe({
      next: (products) => {
        this.allProducts = products;
        this.applyFilters();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading products:', err);
        this.loadError = true;
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
    this.currentPage = 1;
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

  get paginatedProducts(): Products[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredProducts.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredProducts.length / this.pageSize);
  }

  get visiblePages(): number[] {
    const start = Math.max(1, Math.min(this.currentPage - 1, this.totalPages - 2));
    const end = Math.min(this.totalPages, start + 2);
    return Array.from({ length: Math.max(0, end - start + 1) }, (_, index) => start + index);
  }

  get resultStart(): number {
    return this.filteredProducts.length === 0 ? 0 : (this.currentPage - 1) * this.pageSize + 1;
  }

  get resultEnd(): number {
    return Math.min(this.currentPage * this.pageSize, this.filteredProducts.length);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.currentPage) {
      return;
    }

    this.currentPage = page;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedCategory = 'All Categories';
    this.selectedStatus = 'Any Status';
    this.selectedSort = 'Sort';
    this.applyFilters();
  }

  trackProduct(_: number, product: Products): string | undefined {
    return product._id;
  }

  get lowStockCount(): number {
    return this.allProducts.filter((product) => product.productStock > 0 && product.productStock <= 5).length;
  }
}
