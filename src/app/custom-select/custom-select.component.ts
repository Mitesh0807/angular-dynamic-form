import { NgClass } from '@angular/common';
import {
  Component,
  HostListener,
  output,
  ViewChild,
  input,
  signal,
  ContentChildren,
  QueryList,
} from '@angular/core';
import { OverlayModule, CdkOverlayOrigin } from '@angular/cdk/overlay';
import {
  animate,
  state,
  style,
  transition,
  trigger,
  AnimationEvent,
} from '@angular/animations';
import { CustomOptionComponent } from './custom-option/custom-option.component';

@Component({
  selector: 'app-custom-select',
  standalone: true,
  imports: [NgClass, OverlayModule],
  templateUrl: './custom-select.component.html',
  styleUrls: ['./custom-select.component.scss'],
  animations: [
    trigger('dropDown', [
      state('void', style({ transform: 'scaleY(0)', opacity: 0 })),
      state('*', style({ transform: 'scaleY(1)', opacity: 1 })),
      transition(':enter', [animate('320ms cubic-bezier(0,1,0.45,1.34)')]),
      transition(':leave', [
        animate('420ms cubic-bezier(0.88,-0.7,0.86,0.85)'),
      ]),
    ]),
  ],
})
export class CustomSelectComponent<T> {
  label = input<string>('');
  value = input<string | null>('');
  isOpen = signal(false);

  readonly opened = output();
  readonly selectionChanged = output();
  readonly closed = output();
  readonly searchChanged = output<string>();

  @ViewChild(CdkOverlayOrigin) origin!: CdkOverlayOrigin;

  @HostListener('click')
  toggleOpen() {
    this.isOpen.set(true);
  }
  close() {
    this.isOpen.set(false);
  }

  @ContentChildren(CustomOptionComponent, {
    descendants: true,
  })
  options!: QueryList<CustomOptionComponent<T>>;

  ngAfterContentInit() {
    this.highlightSelectedOptions(this.value());
  }

  onPanelAnimationDone({ fromState, toState }: AnimationEvent) {
    if (fromState === 'void' && toState === null && this.isOpen()) {
      this.opened.emit();
    }
    if (fromState === null && toState === 'void' && !this.isOpen()) {
      this.closed.emit();
    }
  }

  private highlightSelectedOptions(value: string | null) {
    const option = this.findOptionsByValue(value);
    if (option) {
      option.highlightAsSelected();
    }
  }

  private findOptionsByValue(value: string | null) {
    return this.options && this.options.find((o) => o.value() === value);
  }
}
