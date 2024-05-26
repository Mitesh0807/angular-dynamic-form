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
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
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
  imports: [NgClass, OverlayModule, CommonModule],
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
  @Input()
  label = '';

  @Input()
  searchable = false;

  @Input()
  @HostBinding('class.disabled')
  disabled = false;

  @Input()
  displayWith: ((value: T) => string | number) | null = null;

  @Input()
  compareWith: (v1: T | null, v2: T | null) => boolean = (v1, v2) => v1 === v2;

  private multiple: boolean;

  _value = signal<SelectValue<T>>(null);
  private _options = signal<
    QueryList<Highlightable & CustomOptionComponent<T>>
  >(null!);
  _isOpen = signal(false);
  private _searchText = signal('');

  @Output()
  readonly opened = new EventEmitter<void>();

  @Output()
  readonly selectionChanged = new EventEmitter<SelectValue<T>>();

  @Output()
  readonly closed = new EventEmitter<void>();

  @Output()
  readonly searchChanged = new EventEmitter<string>();

  @ContentChildren(CustomOptionComponent, { descendants: true })
  set options(value: QueryList<Highlightable & CustomOptionComponent<T>>) {
    this._options.set(value);
  }

  // @ViewChild('input')
  // searchInputEl!: ElementRef<HTMLInputElement>;

  searchInputEl = viewChild.required<ElementRef<HTMLInputElement>>('input');

  @HostBinding('attr.tabIndex')
  @Input()
  tabIndex = 0;

  protected onChange: (newValue: SelectValue<T>) => void = () => {};
  protected onTouched: () => void = () => {};

  private optionMap = new Map<T | null, CustomOptionComponent<T>>();

  private listKeyManager!: ActiveDescendantKeyManager<CustomOptionComponent<T>>;

  protected get displayValue() {
    if (this.displayWith && this._value()) {
      return this.displayWith(this._value()?.toString() as T);
    }

    return this._value();
  }

  constructor(
    @Attribute('multiple') multiple: string | null,
    private cd: ChangeDetectorRef,
    private hostEl: ElementRef
  ) {
    this.multiple = coerceBooleanProperty(multiple);

    effect(() => {
      this.setupValue(this._value());
      this.highlightSelectedOptions();
    });

    effect(() => {
      this.refreshOptionsMap();
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
    if (this.disabled) return;
    this._isOpen.set(true);
    if (this.searchable) {
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

  @HostListener('keydown', ['$event'])
  protected onKeyDown(e: KeyboardEvent) {
    if (e.key === 'ArrowDown' && !this._isOpen()) {
      this.open();
      return;
    }
    if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && this._isOpen()) {
      this.listKeyManager.onKeydown(e);
      return;
    }
    if (e.key === 'Enter' && this._isOpen() && this.listKeyManager.activeItem) {
      this.handleSelection(this.listKeyManager.activeItem);
    }
  }

  writeValue(value: SelectValue<T>): void {
    this._value.set(value);
  }
  registerOnChange(fn: any): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }
  setDisabledState?(isDisabled: boolean): void {
    this.disabled = isDisabled;
    this.cd.markForCheck();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['compareWith']) {
      this.highlightSelectedOptions();
    }
  }

  ngAfterContentInit(): void {
    this.listKeyManager = new ActiveDescendantKeyManager(
      this._options().toArray()
    ).withWrap();
    this.listKeyManager.change.subscribe((itemIndex) => {
      this._options().get(itemIndex)?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    });

    this._options().changes.subscribe(() => {
      this.refreshOptionsMap();
      this.highlightSelectedOptions();
    });
  }

  ngOnDestroy(): void {}

  clearSelection(e?: Event) {
    e?.stopPropagation();
    if (this.disabled) return;
    this._value.set(null);
    this.selectionChanged.emit(this._value());
    this.onChange(this._value());
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

  protected onHandleInput(e: Event) {
    this._searchText.set((e.target as HTMLInputElement).value);
    this.searchChanged.emit(this._searchText());
  }

  private setupValue(value: SelectValue<T>) {
    if (value && !Array.isArray(value) && this.multiple) {
      value = [value];
    }
    this._value.set(value);
  }

  private handleSelection(option: CustomOptionComponent<T>) {
    if (this.disabled) return;
    const value = option.value();

    if (this.multiple) {
      const currentValue = (this._value() as T[]) || [];
      if (currentValue.includes(value)) {
        this._value.set(currentValue.filter((v) => v !== value));
      } else {
        this._value.set([...currentValue, value]);
      }
    } else {
      this._value.set(value);
    }

    this.selectionChanged.emit(this._value());
    this.onChange(this._value());

    if (!this.multiple) {
      this.close();
    }
  }

  private refreshOptionsMap() {
    this.optionMap.clear();
    this._options().forEach((o) => this.optionMap.set(o.value(), o));
  }

  private highlightSelectedOptions() {
    const value = this._value();
    if (!value) return;

    const valuesWithUpdatedReferences = (
      Array.isArray(value) ? value : [value]
    ).map((val) => {
      const correspondingOption = this.findOptionsByValue(val);
      return correspondingOption ? correspondingOption.value! : val;
    });

    if (this.multiple) {
      this._value.set(valuesWithUpdatedReferences as SelectValue<T>);
    } else {
      this._value.set(valuesWithUpdatedReferences[0] as SelectValue<T>);
    }
  }

  private findOptionsByValue(value: T | null) {
    if (this.optionMap.has(value)) {
      return this.optionMap.get(value);
    }
    return this._options().find((o) => this.compareWith(o.value(), value));
  }
}
