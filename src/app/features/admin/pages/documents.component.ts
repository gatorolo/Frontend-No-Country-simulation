import { Component, OnInit } from '@angular/core';
import { CaregiverService } from 'src/app/core/services/caregiver.service';
import Swal from 'sweetalert2';

interface CaregiverGroup {
  caregiverId: number;
  caregiverName: string;
  documents: any[];
  lastUpload: Date;
}

@Component({
  selector: 'app-documents',
  templateUrl: './document.component.html',
  styleUrls: ['./document.component.css']
})
export class DocumentsComponent implements OnInit {
  groupedDocuments: CaregiverGroup[] = [];
  selectedGroup: CaregiverGroup | null = null;
  loading = false;

  constructor(private caregiverService: CaregiverService) { }

  ngOnInit(): void {
    this.loadAllDocuments();
  }

  loadAllDocuments() {
    this.loading = true;
    this.caregiverService.getAllDocuments().subscribe({
      next: (docs) => {
        this.groupDocuments(docs);
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading documents:', err);
        this.loading = false;
      }
    });
  }

  private groupDocuments(docs: any[]) {
    const groups: { [key: number]: CaregiverGroup } = {};

    docs.forEach(doc => {
      if (!groups[doc.caregiverId]) {
        groups[doc.caregiverId] = {
          caregiverId: doc.caregiverId,
          caregiverName: doc.caregiverName,
          documents: [],
          lastUpload: new Date(doc.uploadDate)
        };
      }

      groups[doc.caregiverId].documents.push(doc);

      const docDate = new Date(doc.uploadDate);
      if (docDate > groups[doc.caregiverId].lastUpload) {
        groups[doc.caregiverId].lastUpload = docDate;
      }
    });

    this.groupedDocuments = Object.values(groups).sort((a, b) =>
      b.lastUpload.getTime() - a.lastUpload.getTime()
    );
  }

  selectCaregiver(group: CaregiverGroup) {
    this.selectedGroup = group;
  }

  closeDetail() {
    this.selectedGroup = null;
  }

  viewDocument(doc: any) {
    if (!doc.content) {
      Swal.fire('Error', 'El documento no tiene contenido', 'error');
      return;
    }

    try {
      const parts = doc.content.split(',');
      if (parts.length < 2) throw new Error('Formato de datos inválido');

      const byteString = atob(parts[1]);
      const mimeString = parts[0].split(':')[1].split(';')[0];

      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }

      const blob = new Blob([ab], { type: mimeString });
      const blobUrl = URL.createObjectURL(blob);

      window.open(blobUrl, '_blank');
    } catch (e) {
      console.error('Error al procesar el documento:', e);
      Swal.fire('Error', 'No se pudo abrir el documento.', 'error');
    }
  }

  deleteDocument(docId: number) {
    Swal.fire({
      title: '¿Eliminar documento?',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.caregiverService.deleteDocument(docId).subscribe({
          next: () => {
            this.loadAllDocuments();
            if (this.selectedGroup) {
              // Actualizar el grupo seleccionado si es necesario
              this.selectedGroup.documents = this.selectedGroup.documents.filter(d => d.id !== docId);
              if (this.selectedGroup.documents.length === 0) {
                this.selectedGroup = null;
              }
            }
            Swal.fire('Eliminado', 'El documento ha sido borrado.', 'success');
          },
          error: (err) => {
            console.error('Error deleting document:', err);
            Swal.fire('Error', 'No se pudo eliminar el documento', 'error');
          }
        });
      }
    });
  }
}
