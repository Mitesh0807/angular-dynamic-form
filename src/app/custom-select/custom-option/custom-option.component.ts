import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-custom-option',
  standalone: true,
  imports: [CommonModule],
  template: `<p>custom-option works!</p>`,
  styleUrl: './custom-option.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomOptionComponent {}