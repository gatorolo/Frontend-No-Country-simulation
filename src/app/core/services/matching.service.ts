import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, catchError, interval, of, startWith, switchMap, tap } from 'rxjs';

export interface ServicePost {
    id: number;
    patientName: string;
    age: number;
    city: string;
    zone: string;
    schedule: string;
    complexity: 'Baja' | 'Media' | 'Alta';
    specialty: 'Enfermería' | 'Kinesiología' | 'Gerontología' | 'Rehabilitación';
    status: 'Publicado' | 'Postulado' | 'Confirmado';
    caregiverName?: string;
    caregiverId?: number;
}

@Injectable({
    providedIn: 'root'
})
export class MatchingService {

    private apiUrl = 'http://localhost:8080/api/service-orders';

    private postsSource = new BehaviorSubject<ServicePost[]>([]);

    posts$ = this.postsSource.asObservable();

    constructor(private http: HttpClient) {
        this.loadPosts().subscribe();
        interval(30000) // Cada 30 segundos (30000 ms)
            .pipe(
                startWith(0), // Ejecuta uno de inmediato al arrancar
                switchMap(() => this.loadPosts()) // Llama a tu método existente
            )
            .subscribe();
    }

    publishPost(post: any): Observable<ServicePost> {
        return this.http.post<ServicePost>(`${this.apiUrl}/publish`, post).pipe(
            tap(() => this.loadPosts().subscribe()) // Refresca la lista automáticamente
        );
    }

    requestService(post: any): Observable<ServicePost> {
        return this.http.post<ServicePost>(`${this.apiUrl}/request`, post).pipe(
            tap(() => this.loadPosts().subscribe())
        );
    }

    getPendingRequests(): Observable<ServicePost[]> {
        return this.http.get<ServicePost[]>(`${this.apiUrl}/pending`);
    }

    publishPendingRequest(id: number): Observable<ServicePost> {
        return this.http.put<ServicePost>(`${this.apiUrl}/${id}/publish-request`, {}).pipe(
            tap(() => this.loadPosts().subscribe())
        );
    }

    applyToPost(postId: number, caregiverId: number, caregiverName: string): Observable<ServicePost> {
        // 1. Limpieza de URL para evitar la doble barra //
        const cleanApiUrl = this.apiUrl.endsWith('/') ? this.apiUrl.slice(0, -1) : this.apiUrl;
        const url = `${cleanApiUrl}/${postId}/apply?caregiverId=${caregiverId}&caregiverName=${caregiverName}`;

        console.log('🔗 URL final construida:', url);

        // 2. Actualización local (Optimista)
        const currentPosts = this.postsSource.getValue();
        const index = currentPosts.findIndex(p => p.id === postId);
        let backupPost = currentPosts[index]; // Guardamos respaldo por si falla el servidor

        if (index !== -1) {
            const updated = [...currentPosts];
            updated[index] = {
                ...updated[index],
                status: 'Postulado',
                caregiverId: caregiverId,
                caregiverName: caregiverName
            };
            this.postsSource.next(updated);
        }

        // 3. Petición al Backend
        return this.http.put<ServicePost>(url, {}).pipe(
            tap((updatedPostFromServer) => {
                console.log('✅ Backend actualizado correctamente');
                // Sincronizamos con los datos REALES del servidor
                const curr = this.postsSource.getValue();
                const idx = curr.findIndex(p => p.id === postId);
                if (idx !== -1) {
                    curr[idx] = updatedPostFromServer;
                    this.postsSource.next([...curr]);
                }
            }),
            catchError((err: any) => {
                console.error('❌ Error 404/500 en Backend:', err);
                // Si el backend falla, podrías revertir el cambio optimista aquí si quisieras
                return of(backupPost);
            })
        );
    }

    // En matching.service.ts
    confirmOrder(postId: number, caregiverId: any, caregiverName: string): Observable<any> {
        // Si caregiverId no viene, le ponemos 0 o 1 para que Java no reciba 'undefined'
        const idParaJava = caregiverId || 1;

        const url = `${this.apiUrl}/${postId}/confirm?caregiverId=${idParaJava}&caregiverName=${caregiverName}`;

        return this.http.put(url, {}).pipe(
            tap(() => {
                console.log(`✅ Guardia ${postId} confirmada`);
                this.loadPosts().subscribe();
            })
        );
    }

    loadPosts(): Observable<ServicePost[]> {
        // Usamos backticks `` para que la variable se combine con el texto
        return this.http.get<ServicePost[]>(`${this.apiUrl}/active`).pipe(
            tap(posts => {
                console.log('Datos recibidos de Java:', posts); // Para que veas en la consola si llega Ricardo Darín
                this.postsSource.next(posts);
            })
        );
    }

    getPosts() {
        return this.postsSource.getValue();
    }

    getActiveOrders(): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/active`);
    }



    confirmCaregiver(postId: number): Observable<any> {
        // Esta es la URL que Java esperará para confirmar la guardia
        const url = `${this.apiUrl}/${postId}/confirm`;

        return this.http.put(url, {}).pipe(
            tap(() => {
                console.log(`✅ Guardia ${postId} confirmada en el servidor`);
                // Opcional: refrescar la lista de posts
                this.loadPosts().subscribe();
            })
        );
    }

    deletePost(postId: number): Observable<any> {
        return this.http.delete(`${this.apiUrl}/${postId}`).pipe(
            tap(() => {
                console.log(`🗑️ Guardia ${postId} eliminada`);
                this.loadPosts().subscribe();
            })
        );
    }
}