import { Component, NgModule, OnInit } from '@angular/core';
import { HeaderComponent } from '../header-component/header-component';
import { RouterLink } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-customerorderstatus-component',
  templateUrl: './customerorderstatus-component.html',
  styleUrl: './customerorderstatus-component.css',
  imports: [HeaderComponent],
  // imports: [HeaderComponent, RouterLink]
})
export class CustomerorderstatusComponent implements OnInit {

  tableId: number = 0;
  items: any;
  total: number = 0;

  constructor(private modalService: NgbModal, private api: ApiService) { }

  ngOnInit() {
    const orderData = localStorage.getItem("orderDetails");
    if (orderData) {
      const parsed = JSON.parse(orderData);
      this.tableId = parsed.tableId;
      this.items = parsed.items;
      this.total = parsed.total;
    }
  }


  open(content: any) {
    this.modalService.open(content, { size: 'lg', centered: true });
  }

}
