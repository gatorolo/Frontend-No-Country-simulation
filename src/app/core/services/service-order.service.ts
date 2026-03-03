import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../constants/api.constants';

@Injectable({
  providedIn: 'root'
})
export class ServiceOrderService {

  private apiUrl = `${API_BASE_URL}/service-orders`;

  constructor(private http: HttpClient) { }

  publishOrder(orderData: any): Observable<any> {
    return this.http.post(this.apiUrl, orderData);
  }

  // 2. Para confirmar una orden de servicio
  // Este método coincide con tu @PutMapping("/{id}/confirm") de Java
  confirmOrder(id: number, caregiverId: number, caregiverName: string): Observable<any> {
    // La URL correcta debe ser: baseUrl/id/confirm
    const url = `${this.apiUrl}/${id}/confirm?caregiverId=${caregiverId}&caregiverName=${caregiverName}`;

    console.log('🔗 Llamando a:', url); // Para verificar que no diga /publish/ en la consola
    return this.http.put(url, {});
  }
}
