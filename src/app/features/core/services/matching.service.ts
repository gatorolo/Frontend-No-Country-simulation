import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

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
    private postsSource = new BehaviorSubject<ServicePost[]>([
        {
            id: 1,
            patientName: 'Roberto Sánchez',
            age: 78,
            city: 'Rosario',
            zone: 'Centro',
            schedule: '08:00 - 16:00',
            complexity: 'Media',
            specialty: 'Gerontología',
            status: 'Publicado'
        }
    ]);

    posts$ = this.postsSource.asObservable();

    publishPost(post: Omit<ServicePost, 'id' | 'status'>) {
        const current = this.postsSource.getValue();
        const newPost: ServicePost = {
            ...post,
            id: Date.now(),
            status: 'Publicado'
        };
        this.postsSource.next([newPost, ...current]);
        return newPost;
    }

    applyToPost(postId: number, caregiverId: number, caregiverName: string) {
        const current = this.postsSource.getValue();
        const index = current.findIndex(p => p.id === postId);
        if (index !== -1) {
            current[index] = {
                ...current[index],
                status: 'Postulado',
                caregiverId,
                caregiverName
            };
            this.postsSource.next([...current]);
            return current[index];
        }
        return null;
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

    getPosts() {
        return this.postsSource.getValue();
    }
}
