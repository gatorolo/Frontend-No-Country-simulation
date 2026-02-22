import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class ConfigService {
    private storageKey = 'valora_config';
    private configSource = new BehaviorSubject<any>(this.loadConfig());
    config$ = this.configSource.asObservable();

    constructor() {
        this.applyTheme();
        // Check theme every minute
        setInterval(() => this.applyTheme(), 60000);
    }

    private loadConfig() {
        const defaults = {
            general: {
                systemName: 'Valora',
                shortDescription: 'Sistema de gestión y seguimiento.',
                contactEmail: 'soporte@valora.com',
                whatsappNumber: '5493415109918',
                defaultLanguage: 'es',
                timezone: 'GMT-3',
                dateFormat: 'DD/MM/YYYY'
            },
            appearance: {
                darkMode: false,
                useAutoTheme: false,
                primaryColor: '#0ea5e9',
                showLogoInSidebar: true
            },
            notifications: {
                emailNotifications: true,
                criticalErrors: true,
                importantEvents: true,
                onUserCreate: true,
                onPasswordChange: true,
                frequency: 'immediate'
            },
            security: {
                requireStrongPassword: true,
                sessionExpiration: '30min',
                allowMultipleSessions: false
            },
            system: {
                maintenanceMode: false
            }
        };

        try {
            const saved = localStorage.getItem(this.storageKey);
            if (saved) {
                const parsed = JSON.parse(saved);
                // Deep merge or at least category merge
                const merged = { ...defaults };
                Object.keys(parsed).forEach(key => {
                    if (merged[key as keyof typeof defaults]) {
                        merged[key as keyof typeof defaults] = {
                            ...merged[key as keyof typeof defaults],
                            ...parsed[key]
                        };
                    }
                });
                console.log('Final Merged Config:', merged);
                return merged;
            }
        } catch (e) {
            console.error('Error loading config from localStorage', e);
        }

        return defaults;
    }

    private saveConfig(config: any) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(config));
            this.configSource.next(config);
            this.applyTheme();
        } catch (e) {
            console.error('Error saving config', e);
        }
    }

    updateConfig(category: string, settings: any) {
        const current = this.configSource.getValue();
        const updated = {
            ...current,
            [category]: { ...current[category], ...settings }
        };
        this.saveConfig(updated);
    }

    getConfig() {
        return this.configSource.getValue();
    }

    getWhatsAppNumber(): string {
        const config = this.configSource.getValue();
        return config?.general?.whatsappNumber || '5493415109918';
    }

    setWhatsAppNumber(number: string) {
        const formatted = number.replace(/\D/g, '');
        this.updateConfig('general', { whatsappNumber: formatted });
    }

    private isNightTime(): boolean {
        const hour = new Date().getHours();
        const isNight = hour >= 20 || hour < 8;
        console.log(`[ConfigService] Hora actual: ${hour}. ¿Es noche (8PM-8AM)?: ${isNight}`);
        return isNight;
    }

    private applyTheme() {
        // Use setTimeout to ensure DOM is ready and avoid initial bootstrap issues
        setTimeout(() => {
            const config = this.configSource.getValue();
            if (!config || !config.appearance) return;

            const { appearance } = config;
            let shouldBeDark = appearance.darkMode;

            if (appearance.useAutoTheme) {
                shouldBeDark = this.isNightTime();
            }

            // Apply Dark Mode
            if (document.body) {
                console.log('App Theme Decision - Auto:', appearance.useAutoTheme, 'Manual Dark:', appearance.darkMode, 'Final Result Dark:', shouldBeDark);
                if (shouldBeDark) {
                    document.body.classList.add('dark-mode');
                } else {
                    document.body.classList.remove('dark-mode');
                }
            }

            // Apply Primary Color
            if (document.documentElement) {
                document.documentElement.style.setProperty('--primary', appearance.primaryColor || '#0ea5e9');
            }
        }, 0);
    }
}
