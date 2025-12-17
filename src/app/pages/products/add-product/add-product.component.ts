import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ProductsService } from '../../../service/products.service';

@Component({
  selector: 'app-add-product',
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterLink],
  templateUrl: './add-product.component.html',
  styleUrl: './add-product.component.css',
})
export class AddProductComponent {
  private fb = inject(FormBuilder);
  private productService = inject(ProductsService);
  private router = inject(Router);

  isLoading = false;
  thumbnailImages: string[] = [];
  tags: string[] = ['New Arrival', 'Summer'];

  productForm: FormGroup = this.fb.group({
    productName: ['', [Validators.required, Validators.minLength(3)]],
    category: ['', Validators.required],
    productPrice: ['', [Validators.required, Validators.min(0)]],
    productImage: ['', Validators.required],
    productStock: ['', [Validators.required, Validators.min(0)]],
    productDescription: ['', Validators.required],
  });

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.productForm.patchValue({
          productImage: reader.result as string,
        });
      };
      reader.readAsDataURL(file);
    }
  }

  removeMainImage() {
    this.productForm.patchValue({
      productImage: '',
    });
  }

  addThumbnail() {
    this.thumbnailImages.push('');
  }

  removeThumbnail(index: number) {
    this.thumbnailImages.splice(index, 1);
  }

  addTag(tag: string) {
    if (tag && !this.tags.includes(tag)) {
      this.tags.push(tag);
    }
  }

  removeTag(tag: string) {
    this.tags = this.tags.filter((t) => t !== tag);
  }

  onSubmit() {
    if (this.productForm.valid) {
      this.isLoading = true;
      const productData = {
        ...this.productForm.value,
        productThumnailImages: this.thumbnailImages.filter(
          (img) => img.trim() !== ''
        ),
      };

      this.productService.addProduct(productData).subscribe({
        next: () => {
          this.isLoading = false;
          this.router.navigate(['/products']);
        },
        error: (err: any) => {
          console.error('Error adding product:', err);
          this.isLoading = false;
          alert('Failed to add product');
        },
      });
    } else {
      alert('Please fill all requird fields');
    }
  }
}
