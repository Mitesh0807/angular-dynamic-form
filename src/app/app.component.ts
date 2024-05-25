import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CustomSelectComponent } from './custom-select/custom-select.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CustomSelectComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'letsee lsp working or not';
}
