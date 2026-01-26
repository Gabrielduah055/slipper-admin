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
  currentImage: string = '';
  selectedThumbnailImageIndex: number = -1;
  categories: string[] = [];
  newTag: string = '';

  // File upload properties
  mainImageFile: File | null = null;
  // thumbnailFiles and thumbnailFileIndices are replaced by `thumbnails` structure

  productForm: FormGroup = this.fb.group({
    productName: ['', [Validators.required, Validators.minLength(3)]],
    category: ['', Validators.required],
    sku: [''],
    productPrice: ['', [Validators.required, Validators.min(0)]],
    salePrice: [0, [Validators.min(0)]],
    productImage: ['', Validators.required],
    productStock: ['', [Validators.required, Validators.min(0)]],
    productDescription: ['', Validators.required],
    isActive: [true],
    vendor: [''],
    weight: [0, [Validators.min(0)]],
    location: [''],
    barcode: [''],
    width: [0, [Validators.min(0)]],
    height: [0, [Validators.min(0)]],
    depth: [0, [Validators.min(0)]],
  });

  tags: string[] = [];

  // Image handling
  thumbnails: { url: string; file?: File }[] = [];

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadProduct(id);
    }
    this.loadCategories();
  }

  loadCategories() {
    this.productService.getCategories().subscribe({
      next: (categories) => (this.categories = categories),
      error: (err) => {
        console.error('Failed to load categories:', err);
      }
    });
  }

  loadProduct(id: string) {
    this.isLoading = true;
    this.productService.getProduct(id).subscribe({
      next: (product) => {
        this.product = product;

        // Initialize thumbnails from existing URLs
        this.thumbnails = (product.productThumbnailImages || []).map(url => ({ url }));

        this.currentImage =
          product.productImage || 'https://via.placeholder.com/500';
        this.selectedThumbnailImageIndex = -1;
        this.productForm.patchValue({
          productName: product.productName,
          category: product.category,
          productPrice: product.productPrice,
          productImage: product.productImage,
          productStock: product.productStock,
          productDescription: product.productDescription,
          isActive: product.isActive !== false,
         
        });
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

  selectThumbnail(index: number) {
    if (this.thumbnails[index]) {
      this.currentImage = this.thumbnails[index].url;
      this.selectedThumbnailImageIndex = index;
    }
  }

  resetMainImage() {
    if (this.product) {
      this.currentImage =
        this.mainImageFile ? (this.productForm.get('productImage')?.value) : // If new file selected, show preview
          (this.product.productImage || 'https://via.placeholder.com/500');
      this.selectedThumbnailImageIndex = -1;
    }
  }

  toggleEdit() {
    this.isEditing = !this.isEditing;
    if (!this.isEditing) {
      // Reset form when canceling
      this.mainImageFile = null;
      this.thumbnails = [];
      this.loadProduct(this.product!._id!);
    } else {
      //ensure current image is set
      if(this.product) {
        this.currentImage = this. product.productImage || 'https://via.placeholder.com/500';
        this.selectedThumbnailImageIndex = -1;
      }
    }
  }

  onMainImageSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.mainImageFile = file;
      const reader = new FileReader();
      reader.onload = () => {
        this.currentImage = reader.result as string;
        this.productForm.patchValue({
          productImage: reader.result as string,
        });
      };
      reader.readAsDataURL(file);
    }
  }

  triggerMainImageInput() {
    const input = document.querySelector('#mainImageInput') as HTMLInputElement;
    if (input) {
      input.click();
    }
  }

  onThumbnailSelected(event: any, index: number) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        // Update the specific thumbnail with new file and preview URL
        this.thumbnails[index] = {
          url: reader.result as string,
          file: file
        };
        
        //optionally select this thumbnail after upload
        this.selectThumbnail(index);
      };
      reader.onerror = (error) => {
        console.error('Error reading thumbnail file:', error);
        alert('Failed to read thumbnail file');
      }
      reader.readAsDataURL(file);

      // Reset the input so the same file can be selected again if needed
      event.target.value = '';
    }
  }

  //method to trigger file input 
  triggerThumbnailInput(index: number) {
    const inputs = document.querySelectorAll(`input[type="file"][data-thumbnail-index]`) as NodeListOf<HTMLInputElement>;
    const input = Array.from(inputs).find(inp => parseInt(inp.getAttribute('data-thumbnail-index') || '-1') === index);
    if(input) {
      input.click();
    }
  }

  addThumbnail() {
    // Add a placeholder for a new thumbnail
    // In the UI, this might just show an empty slot or trigger the file input immediately
    // For now, let's push an empty object which the template should handle (showing upload button)
    this.thumbnails.push({ url: '' });
  }

  removeThumbnail(index: number) {
    this.thumbnails.splice(index, 1);

    if (this.selectedThumbnailImageIndex === index) {
      this.resetMainImage();
    } else if (this.selectedThumbnailImageIndex > index) {
      this.selectedThumbnailImageIndex--;
    }
  }

  addTag() {
    if (this.newTag.trim() && !this.tags.includes(this.newTag.trim())) {
      this.tags.push(this.newTag.trim());
      this.newTag = '';
    }
  }

  removeTag(tag: string) {
    this.tags = this.tags.filter((t) => t !== tag);
  }

  onTagInputKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.addTag();
    }
  }

  updateProduct() {
    if (this.productForm.valid && this.product?._id) {
      this.isLoading = true;

      const formData = new FormData();

      // Add text fields
      formData.append('category', String(this.productForm.value.category));
      formData.append('productName', String(this.productForm.value.productName));
      formData.append('productPrice', String(this.productForm.value.productPrice));
      formData.append('productStock', String(this.productForm.value.productStock));
      formData.append('productSize', String(this.product?.productSize || ''));
      formData.append('productDescription', String(this.productForm.value.productDescription));
      formData.append('isActive', this.productForm.value.isActive ? 'true' : 'false');

      // Add optional fields
      if (this.productForm.value.sku) formData.append('sku', String(this.productForm.value.sku));
      if (this.productForm.value.salePrice) formData.append('salePrice', String(this.productForm.value.salePrice));
      if (this.productForm.value.vendor) formData.append('vendor', String(this.productForm.value.vendor));
      if (this.productForm.value.weight) formData.append('weight', String(this.productForm.value.weight));
      if (this.productForm.value.location) formData.append('location', String(this.productForm.value.location));
      if (this.productForm.value.barcode) formData.append('barcode', String(this.productForm.value.barcode));
      if (this.productForm.value.width) formData.append('width', String(this.productForm.value.width));
      if (this.productForm.value.height) formData.append('height', String(this.productForm.value.height));
      if (this.productForm.value.depth) formData.append('depth', String(this.productForm.value.depth));

      // Add tags
      if (this.tags.length > 0) {
        formData.append('tags', JSON.stringify(this.tags));
      }

      // Add main image file if selected
      if (this.mainImageFile) {
        formData.append('productImage', this.mainImageFile);
      } else {
        // Keep existing image URL
        formData.append('productImage', this.productForm.value.productImage || this.product?.productImage);
      }

      // Handle thumbnails

      const existingThumbnailUrls: string[] = [];
      const newThumbnailFiles: File[] = [];

      this.thumbnails.forEach(thumb => {
        if (thumb.file) {
          // New file to upload
          newThumbnailFiles.push(thumb.file);
        } else if (thumb.url && !thumb.url.startsWith('data:')) {
          // Existing URL (not a data URL from FileReader)
          // Only include URLs that are actual HTTP/HTTPS URLs
          if (thumb.url.startsWith('http://') || thumb.url.startsWith('https://')) {
            existingThumbnailUrls.push(thumb.url);
          }
        }
      });

       // Append existing thumbnail URLs as strings (they go to req.body)
       existingThumbnailUrls.forEach(url => {
        formData.append('productThumbnailImages', url);
      });

      // Append new thumbnail files (they go to req.files)
      newThumbnailFiles.forEach(file => {
        formData.append('productThumbnailImages', file);
      });

      this.productService
        .updateProduct(this.product._id, formData)
        .subscribe({
          next: () => {
            this.isLoading = false;
            this.isEditing = false;
            this.mainImageFile = null;
            this.thumbnails = [];
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

  getStockPercentage(): number {
    const stock = this.productForm.get('productStock')?.value || 0;
    return Math.min((stock / 100) * 100, 100);
  }

  isLowStock(): boolean {
    const stock = this.productForm.get('productStock')?.value || 0;
    return stock <= 10;
  }

  getViewStockPercentage(): number {
    const stock = this.product?.productStock || 0;
    return Math.min((stock / 100) * 100, 100);
  }

  isViewLowStock(): boolean {
    const stock = this.product?.productStock || 0;
    return stock <= 10;
  }
}