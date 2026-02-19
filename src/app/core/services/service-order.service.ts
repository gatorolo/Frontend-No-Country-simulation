import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ServiceOrderService {

  private apiUrl = 'http://localhost:8080/api/service-orders/publish';

  constructor(private http: HttpClient) { }

  publishOrder(orderData: any): Observable<any> {
    return this.http.post(this.apiUrl, orderData);
  }
}
