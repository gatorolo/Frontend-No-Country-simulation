import { Component } from '@angular/core';
import { RouterOutlet } from "@angular/router";

@Component({
    selector: 'app-configuracion',
    template: '<router-outlet></router-outlet>',
    imports: [RouterOutlet],
    standalone: true
})
export class ConfiguracionComponent { }
