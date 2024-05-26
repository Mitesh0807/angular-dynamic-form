import {
  animate,
  AnimationEvent,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import {
  AfterContentInit,
  Attribute,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ContentChildren,
  ElementRef,
  EventEmitter,
  HostBinding,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  QueryList,
  SimpleChanges,
  ViewChild,
  signal,
  computed,
  effect,
  viewChild,
  input,
  model,
  contentChildren,
} from '@angular/core';
import {
  ControlValueAccessor,
  FormsModule,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
} from '@angular/forms';
import { ActiveDescendantKeyManager, Highlightable } from '@angular/cdk/a11y';
import { CustomOptionComponent } from './custom-option/custom-option.component';
import { OverlayModule } from '@angular/cdk/overlay';
import { CommonModule, NgClass } from '@angular/common';

export type SelectValue<T> = T | T[] | null;

@Component({
  selector: 'app-custom-select',
  templateUrl: './custom-select.component.html',
  styleUrls: ['./custom-select.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    NgClass,
    OverlayModule,
    ReactiveFormsModule,
    FormsModule,
  ],
  animations: [
    trigger('dropDown', [
      state('void', style({ transform: 'scaleY(0)', opacity: 0 })),
      state('*', style({ transform: 'scaleY(1)', opacity: 1 })),
      transition(':enter', [animate('320ms cubic-bezier(0, 1, 0.45, 1.34)')]),
      transition(':leave', [
        animate('420ms cubic-bezier(0.88,-0.7, 0.86, 0.85)'),
      ]),
    ]),
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: CustomSelectComponent,
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomSelectComponent<T>
  implements OnChanges, AfterContentInit, OnDestroy, ControlValueAccessor
{
  label = input<string>('');

  searchable = input<boolean>(false);

  disabled = model<boolean>(false);
  @HostBinding('class.disabled')
  get disabledClass() {
    return this.disabled();
  }

  @Input()
  displayWith: ((value: T) => string | number) | null = null;

  @Input()
  compareWith: (v1: T | null, v2: T | null) => boolean = (v1, v2) => v1 === v2;

  private multiple: boolean;

  value = model<SelectValue<T>>(null);

  _isOpen = signal(false);
  searchText = signal('');

  @Output()
  readonly opened = new EventEmitter<void>();

  @Output()
  readonly selectionChanged = new EventEmitter<SelectValue<T>>();

  @Output()
  readonly closed = new EventEmitter<void>();

  @Output()
  readonly searchChanged = new EventEmitter<string>();

  // @ContentChildren(CustomOptionComponent, { descendants: true })
  // set options(value: QueryList<Highlightable & CustomOptionComponent<T>>) {
  //   this._options.set(value);
  // }

  options = contentChildren<CustomOptionComponent<T>>(CustomOptionComponent, {
    descendants: true,
  });

  // @ViewChild('input')
  // searchInputEl!: ElementRef<HTMLInputElement>;

  searchInputEl = viewChild.required<ElementRef<HTMLInputElement>>('input');

  @HostBinding('attr.tabIndex')
  @Input()
  tabIndex = 0;

  protected onChange: (newValue: SelectValue<T>) => void = () => {};
  protected onTouched: () => void = () => {};

  private optionMap = new Map<T | null, CustomOptionComponent<T>>();

  // private listKeyManager!: ActiveDescendantKeyManager<Readonly<CustomOptionComponent<T>>>;
  protected get displayValue() {
    const currentValue = this.value();
    if (this.displayWith && currentValue) {
      if (Array.isArray(currentValue)) {
        return currentValue.map(this.displayWith);
      }
    }
    return this.value();
  }

  constructor(
    @Attribute('multiple') multiple: string | null,
    private cd: ChangeDetectorRef,
    private hostEl: ElementRef
  ) {
    this.multiple = coerceBooleanProperty(multiple);

    effect(() => {
      this.options().forEach((o) => {
        console.log(o.isSelected());

        this.handleSelection(o);
        //this.handleSelection;
      });
    });

    effect(() => {
      this.highlightSelectedOptions();
    });
  }

  @HostListener('blur')
  markAsTouched() {
    if (!this.disabled && !this._isOpen()) {
      this.onTouched();
      this.cd.markForCheck();
    }
  }

  @HostListener('click')
  open() {
    if (this.disabled()) return;
    this._isOpen.set(true);
    if (this.searchable()) {
      setTimeout(() => {
        this.searchInputEl().nativeElement.focus();
      }, 0);
    }
    this.cd.markForCheck();
  }

  close() {
    this._isOpen.set(false);
    this.onTouched();
    this.hostEl.nativeElement.focus();
    this.cd.markForCheck();
  }

  // @HostListener('keydown', ['$event'])
  // protected onKeyDown(e: KeyboardEvent) {
  //   if (e.key === 'ArrowDown' && !this._isOpen()) {
  //     this.open();
  //     return;
  //   }
  //   if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && this._isOpen()) {
  //     this.listKeyManager.onKeydown(e);
  //     return;
  //   }
  //   if (e.key === 'Enter' && this._isOpen() && this.listKeyManager.activeItem) {
  //     this.handleSelection(this.listKeyManager.activeItem);
  //   }
  // }

  writeValue(value: SelectValue<T>): void {
    this.value.set(value);
  }
  registerOnChange(fn: any): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }
  setDisabledState?(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
    // this.cd.markForCheck();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['compareWith']) {
      this.highlightSelectedOptions();
    }
  }

  ngAfterContentInit(): void {
    effect(() => {
      this.options().forEach((o) => {
        console.log(o);
        //this.handleSelection;
      });
    });
    // this.listKeyManager = new ActiveDescendantKeyManager(
    //   this.options()
    // ).withWrap();
    // this.listKeyManager.change.subscribe((itemIndex) => {
    //   this.options().find(itemIndex)
    //   this.options().get(itemIndex)?.scrollIntoView({
    //     behavior: 'smooth',
    //     block: 'center',
    //   });
    // });
  }

  ngOnDestroy(): void {}

  clearSelection(e?: Event) {
    e?.stopPropagation();
    if (this.disabled()) return;
    this.value.set(null);
    this.selectionChanged.emit(this.value());
    this.onChange(this.value());
    this.cd.markForCheck();
  }

  protected onPanelAnimationDone({ fromState, toState }: AnimationEvent) {
    if (fromState === 'void' && toState === null && this._isOpen()) {
      this.opened.emit();
    }
    if (fromState === null && toState === 'void' && !this._isOpen()) {
      this.closed.emit();
    }
  }

  protected onHandleInput(e: string) {
    this.searchText.set(e);
    this.searchChanged.emit(this.searchText());
  }

  private setupValue(value: SelectValue<T>) {
    if (value && !Array.isArray(value) && this.multiple) {
      value = [value];
    }
    this.value.set(value);
  }

  private handleSelection(option: CustomOptionComponent<T>) {
    if (this.disabled()) return;
    const value = option.value();

    if (this.multiple) {
      const currentValue = this.value() as T[];
      if (currentValue && currentValue.includes(value)) {
        this.value.set(currentValue.filter((v) => v !== value));
      } else {
        this.value.set([...currentValue, value]);
      }
    } else {
      this.value.set(value);
    }

    this.selectionChanged.emit(this.value());
    this.onChange(this.value());

    if (!this.multiple) {
      this.close();
    }
  }

  private highlightSelectedOptions() {
    const value = this.value();
    if (!value) return;
    const valuesWithUpdatedReferences = (
      Array.isArray(value) ? value : [value]
    ).map((val) => {
      const correspondingOption = this.findOptionsByValue(val);
      return correspondingOption ? correspondingOption.value() : val;
    });

    if (this.multiple) {
      this.value.set(valuesWithUpdatedReferences);
    } else {
      this.value.set(valuesWithUpdatedReferences[0]);
    }
  }

  private findOptionsByValue(value: T | null) {
    const val = this.options().find((op) => op.value() === value);
    if (val) {
      console.log('00');
      return val;
    }
    return this.options().find((o) => this.compareWith(o.value(), value));
  }
}
