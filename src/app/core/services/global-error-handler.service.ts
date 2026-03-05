import { ErrorHandler, Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class GlobalErrorHandlerService implements ErrorHandler {

    handleError(error: any): void {
        const chunkFailedMessage = /Loading chunk [\d]+ failed/;

        if (error.message && chunkFailedMessage.test(error.message)) {
            console.warn('ChunkLoadError detected. Reloading page to fetch latest assets...');
            window.location.reload();
        } else {
            // Re-throw or handle other errors normally
            console.error('An unexpected error occurred:', error);
        }
    }
}
