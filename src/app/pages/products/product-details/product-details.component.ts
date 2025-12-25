import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ProductsService } from '../../../service/products.service';
import { Products } from '../../../interface/product_interface';

@Component({
  selector: 'app-product-details',
  imports: [CommonModule, ReactiveFormsModule, RouterLink, FormsModule],
  templateUrl: './product-details.component.html',
  styleUrl: './product-details.component.css',
})
export class ProductDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private productService = inject(ProductsService);
  private fb = inject(FormBuilder);

  product: Products | null = null;
  isLoading = false;
  isEditing = false;
  thumbnailImages: string[] = [];
  currentImage: string = '';
  selectedThumbnailImageIndex: number = -1;

  productForm: FormGroup = this.fb.group({
    productName: ['', [Validators.required, Validators.minLength(3)]],
    category: ['', Validators.required],
    productPrice: ['', [Validators.required, Validators.min(0)]],
    productImage: ['', Validators.required],
    productStock: ['', [Validators.required, Validators.min(0)]],
    productDescription: ['', Validators.required],
  });

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadProduct(id);
    }
  }

  loadProduct(id: string) {
    this.isLoading = true;
    this.productService.getProduct(id).subscribe({
      next: (product) => {
        this.product = product;
        this.thumbnailImages = product.productThumbnailImages || [];
        this.currentImage =
          product.productImage || 'https://via.placeholder.com/500';
        this.selectedThumbnailImageIndex = -1;
        this.productForm.patchValue(product);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading product:', err);
        this.isLoading = false;
        alert('Product not found');
        this.router.navigate(['/products']);
      },
    });
  }

  // Handle thumbnail click - switch main image
  selectThumbnail(index: number) {
    if (this.thumbnailImages[index]) {
      this.currentImage = this.thumbnailImages[index];
      this.selectedThumbnailImageIndex = index;
    }
  }

  // Reset to main product image
  resetMainImage() {
    if (this.product) {
      this.currentImage =
        this.product.productImage || 'https://via.placeholder.com/500';
      this.selectedThumbnailImageIndex = -1;
    }
  }

  toggleEdit() {
    this.isEditing = !this.isEditing;
  }

  addThumbnail() {
    this.thumbnailImages.push('');
  }

  removeThumbnail(index: number) {
    this.thumbnailImages.slice(index, 1);
    //reset to main image
    if (this.selectedThumbnailImageIndex === index) {
      this.resetMainImage();
    } else if (this.selectedThumbnailImageIndex > index) {
      this.selectedThumbnailImageIndex--;
    }
  }

  updateProduct() {
    if (this.productForm.valid && this.product?._id) {
      this.isLoading = true;
      const productData = {
        ...this.productForm.value,
        productThumnailImages: this.thumbnailImages.filter(
          (img) => img.trim() !== ''
        ),
      };
      this.productService
        .updateProduct(this.product._id, productData)
        .subscribe({
          next: () => {
            this.isLoading = false;
            this.isEditing = false;
            this.loadProduct(this.product!._id!);
          },
          error: (err) => {
            console.error('Error updating product: ', err);
            this.isLoading = false;
            alert('Failed to update product');
          },
        });
    }
  }

  deleteProduct() {
    if (
      this.product?._id &&
      confirm('Are you sure you want to delete this product?')
    ) {
      this.isLoading = true;
      this.productService.deleteProduct(this.product._id).subscribe({
        next: () => {
          this.router.navigate(['/products']);
        },
        error: (err) => {
          console.error('Error deleting product:', err);
          this.isLoading = false;
          alert('Failed to delete product');
        },
      });
    }
  }
}
