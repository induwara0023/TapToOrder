import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { AdminHeader } from "../admin-header/admin-header";
import { Sidebar } from "../sidebar/sidebar";
import { ApiService } from '../../services/api.service';
import { CommonModule } from '@angular/common';
import { NgFor } from '@angular/common';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { firstValueFrom } from 'rxjs';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-tablemanage-component',
  imports: [AdminHeader, Sidebar, CommonModule, NgFor, ReactiveFormsModule, RouterOutlet],
  templateUrl: './tablemanage-component.html',
  styleUrl: './tablemanage-component.css'
})
export class TablemanageComponent implements OnInit {
  tables: any[] = [];
  addTableModal: any;
  updateTableModal: any;
  newTableAddForm!: FormGroup;

  constructor(private api: ApiService, private cdr: ChangeDetectorRef , private modalService: NgbModal, private fb: FormBuilder) {
    this.loadTables();

    this.newTableAddForm = this.fb.group({
      newTableName: ['', Validators.required],
      newTableId: [''] // id eka update karanna use wenawa
    });

  }
  ngOnInit(): void {
    this.loadTables();
  }

  // load tables
  async loadTables(): Promise<void> {
    try {
      const data: any = await firstValueFrom(this.api.getTables());
      if (data.success) {
        this.tables = data.data;
        this.cdr.detectChanges();
        // const tableCount = this.tables.length;
        // console.log('Total Tables:', tableCount);
      }
    } catch (error) {
      console.error('Error loading tables:', error);
    }
  }

  // loadTables() {
  //   this.api.getTables().subscribe((data: any) => {
  //     if(data.success) {
  //       this.tables = data.data;
  //     }
  //   });
  // }

  // add new table popup open
  openAddTableModal(addTableModal: any) {
    this.modalService.open(addTableModal, { size: 'lg', centered: true });
    this.newTableAddForm.reset();
  }

  // add new table
  async addTable(): Promise<void> {
    const newTableData = this.newTableAddForm.value;
    try{
      const response: any = await firstValueFrom(
        this.api.addNewTable(newTableData)
      );

      if(response?.success) {
        
        this.tables.push(response.data);
        // this.cdr.detectChanges();
        await this.loadTables();
        this.newTableAddForm.reset();
        this.modalService.dismissAll();
        Swal.fire('Success', 'New table added successfully', 'success');
      }else{
        Swal.fire('Error', response.message, 'error');
      }

    } catch (error) {
      console.error('Error adding table:', error);
    }
  }

  // copy table url to clipboard
  copyToClipboard(url: string){
    navigator.clipboard.writeText(url).then(()=>{
      Swal.fire('Copied!', 'Table  NFC_URL copied to clipboard.', 'success');
    })
  }

  // open update table modal
  openUpdateTableModal(updateTableModal: any, table: any) {
    this.modalService.open(updateTableModal, { size: 'lg', centered: true });
    this.newTableAddForm.patchValue({
      newTableName: table.name,
      newTableId: table.id
    });
    console.log('Update Table id:', table.id);
  }

  // update table
  async updateTable(): Promise<void> {
    const updatedTableData = this.newTableAddForm.value;
    console.log('Updated Table Data:', updatedTableData);
    console.log(updatedTableData.newTableId);
    try {
      const response: any = await firstValueFrom(
        this.api.updateTable(updatedTableData)
      );

      if (response?.success) {
        // const index = this.tables.findIndex(table => table.id === response.data.id);
        // if (index !== -1) {
        //   this.tables[index] = response.data;
        // }
        await this.loadTables();
        this.newTableAddForm.reset();
        this.modalService.dismissAll();
        Swal.fire('Success', 'Table updated successfully', 'success');
      } else {
        Swal.fire('Error', response.message, 'error');
      }

    } catch (error) {
      console.error('Error updating table:', error);
    }
  }

  // delete table
  async deleteTable(tableId: number): Promise<void> {
    const confirmResult = await Swal.fire({
      title: 'Are you sure?',
      text: 'This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    });

    if (confirmResult.isConfirmed) {
      try {
        const response: any = await firstValueFrom(
          this.api.deleteTable(tableId)
        );

        if (response?.success) {
          await this.loadTables();
          Swal.fire('Deleted!', 'Table has been deleted.', 'success');
        } else {
          Swal.fire('Error', response.message, 'error');
        }

      } catch (error) {
        console.error('Error deleting table:', error);
        Swal.fire('Error', 'Failed to delete table. Please try again.', 'error');
      }
    }
  }

}