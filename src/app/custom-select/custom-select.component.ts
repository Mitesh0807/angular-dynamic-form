import { NgClass } from '@angular/common';
import {
  Component,
  HostListener,
  output,
  input,
  signal,
  viewChild,
  contentChildren,
  Input,
  OnChanges,
  AfterContentInit,
  OnDestroy,
  SimpleChanges,
  HostBinding,
  effect,
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
import { SelectionModel } from '@angular/cdk/collections';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { ControlValueAccessor } from '@angular/forms';

export type SelectValue<T> = T | T[] | null;
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
export class CustomSelectComponent<T>
  implements OnChanges, AfterContentInit, OnDestroy, ControlValueAccessor
{
  constructor() {
    effect(() => {
      const optionsChanged = this.options();
      console.log(optionsChanged, 'effect');
      this.refreshOptionsMap();
      this.highlightSelectedOptions();
    });
  }
  //Control value accessor impl
  writeValue(obj: any): void {
    // throw new Error('Method not implemented.');
  }
  registerOnChange(fn: any): void {
    // throw new Error('Method not implemented.');
  }
  registerOnTouched(fn: any): void {
    // throw new Error('Method not implemented.');
  }
  setDisabledState?(isDisabled: boolean): void {
    // throw new Error('Method not implemented.');
  }
  ngOnDestroy(): void {
    //memory cleanup
  }
  ngOnChanges(changes: SimpleChanges): void {
    console.log(changes, 'changes');
  }
  label = input<string>('');
  isOpen = signal(false);
  _value = signal<T>(null as T);
  multiple = input<boolean>(false);
  optionMap = new Map<T | null, CustomOptionComponent<T>>();

  disabled = signal<boolean>(false);
  @HostBinding('class.disabled')
  get disabledClass() {
    return this.disabled();
  }

  protected onChange: (newValue: SelectValue<T>) => void = () => {};

  @Input({ required: true })
  get value() {
    return this._value();
  }
  set value(value: T) {
    console.log(value, 'value');
    this.setupValue(value);
    this.onChange(this._value());
    this.highlightSelectedOptions();
  }

  private selectionModel = new SelectionModel<T>(
    coerceBooleanProperty(this.multiple())
  );

  readonly opened = output();
  readonly selectionChanged = output();
  readonly closed = output();
  readonly searchChanged = output<string>();

  origin = viewChild<CdkOverlayOrigin>(CdkOverlayOrigin);

  @HostListener('click')
  toggleOpen() {
    this.isOpen.set(true);
  }
  close() {
    this.isOpen.set(false);
  }

  options = contentChildren<CustomOptionComponent<T>>(CustomOptionComponent, {
    descendants: true,
  });

  ngAfterContentInit() {
    console.log(this.options(), 'after content init');
    this.options();
  }

  onPanelAnimationDone({ fromState, toState }: AnimationEvent) {
    if (fromState === 'void' && toState === null && this.isOpen()) {
      this.opened.emit();
    }
    if (fromState === null && toState === 'void' && !this.isOpen()) {
      this.closed.emit();
    }
  }

  private refreshOptionsMap() {
    this.optionMap.clear();
    this.options()?.forEach((o) => this.optionMap.set(o.value(), o));
  }

  private setupValue(value: T) {
    this.selectionModel.clear();
    if (value) {
      if (Array.isArray(value)) {
        this.selectionModel.select(...value);
      } else {
        this.selectionModel.select(value);
      }
    }
  }

  private highlightSelectedOptions() {
    const valueWithUpdatedReferences = this.selectionModel.selected.map(
      (value) => {
        console.log(value, 'aaaa');
        const correspondingOption = this.findOptionsByValue(value);
        console.log(correspondingOption, 'a');
        return correspondingOption ? correspondingOption.value() : value;
      }
    );
  }

  private findOptionsByValue(value: T) {
    console.log(this.options(), 'adww');
    return this.options && this.options().find((o) => o.value() === value);
  }
}
