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
  value = input.required<T>();
  selected = output<CustomOptionComponent<T>>();
  disabledReason = input<string>('Selection is Disabled');
  private el = inject(ElementRef<HTMLElement>);

  disabled = input<boolean>(false);
  @HostBinding('class.disabled')
  get disabledClass() {
    return this.disabled();
  }

  @HostListener('click')
  protected select() {
    if (!this.disabled()) {
      this.highlightAsSelected();
      this.selected.emit(this);
    }
  }

  protected isSelected = signal<boolean>(false);
  @HostBinding('class.selected')
  /**
   * Returns true if the option is currently selected, false otherwise.
   *

  @HostBinding('class.selected')
  protected isSelected = signal<boolean>(false);

  this way it will always return signal object which eventuly true 
   * @return {boolean} True if the option is selected, false otherwise.
   */
  get selectedClass() {
    return this.isSelected();
  }

  protected isActive = signal<boolean>(false);
  @HostBinding('class.active')
  get activeClass() {
    return this.isActive();
  }
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
