import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  
  categories: any[] =[];

  constructor(private api: ApiService){}

   async loadCategories(): Promise<any[]> {
    try {
      const data: any = await firstValueFrom(this.api.getCategories());
      if (data && Array.isArray(data)) {
        this.categories = data;
      } else if (data && Array.isArray(data.categories)) {
        this.categories = data.categories;
      } else {
        this.categories = [];
      }

      return this.categories;
    } catch (error) {
      console.error('Error processing categories:', error);
      this.categories = [];
      return [];
    }
  }

}
