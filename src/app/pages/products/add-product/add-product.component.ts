import { Component, inject, OnInit } from '@angular/core';
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
export class AddProductComponent implements OnInit{
  private fb = inject(FormBuilder);
  private productService = inject(ProductsService);
  private router = inject(Router);

  isLoading = false;
  thumbnailImages: string[] = [];
  thumbnailFiles: File[] = [];
  mainImageFile: File | null = null;
  tags: string[] = ['New Arrival', 'Summer'];
  categories: string[] = [];

  productForm: FormGroup = this.fb.group({
    productName: ['', [Validators.required, Validators.minLength(3)]],
    category: ['', Validators.required],
    productPrice: [null, [Validators.required, Validators.min(0)]],
    productImage: ['', Validators.required],
    productStock: [null, [Validators.required, Validators.min(0)]],
    productSize: [null, [Validators.required, Validators.min(0)]],
    productDescription: ['', Validators.required],
    status: ['active'],
    featured:[false],
  });

  ngOnInit(): void {
    this.productService.getCategories().subscribe({
      next: (categories) => (this.categories = categories),
      error: (err) => {
        console.error('Failed to load categories:', err);
      }
    })
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.mainImageFile = file;
      const reader = new FileReader();
      reader.onload = () => {
        this.productForm.patchValue({
          productImage: reader.result as string,
        });
      };
      reader.readAsDataURL(file);
    }
  }

  onThumbnailsSelected(event: any) {
    const files: FileList = event.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file: File) => {
      this.thumbnailFiles.push(file)
      const reader = new FileReader();
      reader.onload = () => {
        this.thumbnailImages.push(reader.result as string);
      }
      reader.readAsDataURL(file)
    })

    event.target.value = ''
  }

  removeMainImage() {
    this.mainImageFile = null;
    this.productForm.patchValue({
      productImage: '',
    });
  }

  addThumbnail() {
    this.thumbnailImages.push('');
  }

  removeThumbnail(index: number) {
    this.thumbnailImages.splice(index, 1);
    this.thumbnailFiles.splice(index, 1)
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

    console.log('Form valid:', this.productForm.valid);
    console.log('Form error:', this.productForm.errors);
    



    // Check form errors
    
      Object.keys(this.productForm.controls).forEach((key) => {
        const control = this.productForm.get(key);
        if (control?.invalid) {
          console.log(`${key} is invalid:`, control.errors);
        }
      });

    if (
      this.productForm.valid &&
      this.mainImageFile &&
      this.thumbnailFiles.length > 0
    ) {
      this.isLoading = true;

      const formData = new FormData();

      formData.append('category', this.productForm.value.category);
      formData.append('productName', this.productForm.value.productName);
      formData.append('productPrice', this.productForm.value.productPrice);
      formData.append('productStock', this.productForm.value.productStock);
      formData.append('productSize', this.productForm.value.productSize);
      formData.append(
        'productDescription',
        this.productForm.value.productDescription
      );
      formData.append(
        'isActive',
        this.productForm.value.status === 'active' ? 'true' : 'false'
      );

      formData.append('productImage', this.mainImageFile);
      this.thumbnailFiles.forEach((file) => {
        formData.append('productThumbnailImages', file);
      });

  
      

      this.productService.addProduct(formData).subscribe({
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
      // More specific error message
      let errorMsg = 'Please fix the following:\n';
      if (!this.productForm.valid)
        errorMsg += '- Form has validation errors (check console)\n';
      if (!this.mainImageFile) errorMsg += '- Main product image is required\n';
      if (this.thumbnailFiles.length === 0)
        errorMsg += '- At least one thumbnail image is required\n';
      alert(errorMsg);
    }
  }
}
