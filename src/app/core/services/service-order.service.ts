import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ServiceOrderService {

  private apiUrl = 'http://localhost:8080/api/service-orders';

  constructor(private http: HttpClient) { }

  publishOrder(orderData: any): Observable<any> {
    return this.http.post(this.apiUrl, orderData);
  }

  // 2. NUEVO: Para que Lara apruebe a Mariano
  // Este método coincide con tu @PutMapping("/{id}/confirm") de Java
  confirmOrder(id: number, caregiverId: number, caregiverName: string): Observable<any> {
    // Armamos la URL con los parámetros que espera el @RequestParam
    const url = `${this.apiUrl}/${id}/confirm?caregiverId=${caregiverId}&caregiverName=${caregiverName}`;

    // El segundo parámetro {} es el cuerpo del mensaje (Body), que enviamos vacío
    return this.http.put(url, {});
  }
}
