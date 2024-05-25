import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostBinding,
  HostListener,
  inject,
  input,
  output,
  signal,
} from '@angular/core';

@Component({
  selector: 'app-custom-option',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="option-content">
      <ng-content />
    </div>
    @if (disabled()) {
    <div class="disabled-reason">
      {{ disabledReason() }}
    </div>
    }
  `,
  styleUrl: './custom-option.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomOptionComponent<T> {
  value = input<T | null>(null);
  selected = output<CustomOptionComponent<T>>();
  disabledReason = input<string>('Selection is Disabled');
  private el = inject(ElementRef<HTMLElement>);

  @HostBinding('class.disabled')
  disabled = input<boolean>(false);

  @HostListener('click')
  protected select() {
    if (!this.disabled()) {
      this.highlightAsSelected();
      this.selected.emit(this);
    }
  }

  @HostBinding('class.selected')
  protected isSelected = signal<boolean>(false);

  @HostBinding('class.active')
  protected isActive = signal<boolean>(false);

  highlightAsSelected() {
    this.isSelected.set(true);
  }
  setInActiveStyle() {
    this.isActive.set(false);
  }
  setActiveStyle() {
    this.isActive.set(true);
  }
  scrollIntoView(options?: ScrollIntoViewOptions) {
    this.el.nativeElement.scrollIntoView(options);
  }
  deselect() {
    this.isSelected.set(false);
  }
}
