import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, catchError, of, tap } from 'rxjs';

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
    }

    publishPost(post: any): Observable<ServicePost> {
        return this.http.post<ServicePost>(`${this.apiUrl}/publish`, post).pipe(
            tap(() => this.loadPosts().subscribe()) // Refresca la lista automáticamente
        );
    }

    applyToPost(postId: number, caregiverId: number, caregiverName: string): Observable<ServicePost> {
        // 1. Actualización local inmediata (optimista) para que la notificación llegue al Admin
        //    sin depender del backend
        const current = this.postsSource.getValue();
        const index = current.findIndex(p => p.id === postId);
        if (index !== -1) {
            const updated = [...current];
            updated[index] = {
                ...updated[index],
                status: 'Postulado',
                caregiverId,
                caregiverName
            };
            this.postsSource.next(updated);
        }

        // 2. Intento HTTP en background (sincroniza con el backend si está disponible)
        const url = `${this.apiUrl}/${postId}/apply?caregiverId=${caregiverId}`;
        return this.http.put<ServicePost>(url, {}).pipe(
            tap((updatedPost) => {
                const curr = this.postsSource.getValue();
                const idx = curr.findIndex(p => p.id === postId);
                if (idx !== -1) {
                    curr[idx] = updatedPost;
                    this.postsSource.next([...curr]);
                }
            }),
            catchError((err: any) => {
                // Backend no disponible: la actualización local ya fue aplicada, ignoramos el error HTTP
                console.warn('Backend no disponible, usando actualización local:', err.message);
                return of(current[index]);
            })
        );
    }

    confirmPost(postId: number) {
        const current = this.postsSource.getValue();
        const index = current.findIndex(p => p.id === postId);
        if (index !== -1) {
            current[index] = {
                ...current[index],
                status: 'Confirmado'
            };
            this.postsSource.next([...current]);
            return current[index];
        }
        return null;
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
}
