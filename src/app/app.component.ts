import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {
  CustomSelectComponent,
  SelectValue,
} from './custom-select/custom-select.component';
import { CustomOptionComponent } from './custom-select/custom-option/custom-option.component';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

export class User {
  constructor(
    public id: number,
    public name: string,
    public nickname: string,
    public country: string,
    public disabled = false
  ) {}
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    CustomSelectComponent,
    CustomOptionComponent,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'letsee lsp working or not';

  selectValue: FormControl<SelectValue<User>> = new FormControl([
    new User(2, 'Niels Bohr', 'niels', 'Denmark'),
    new User(1, 'Albert Einstein', 'albert', 'Germany/USA'),
  ]);
  users: User[] = [
    new User(1, 'Albert Einstein', 'albert', 'Germany/USA'),
    new User(2, 'Niels Bohr', 'niels', 'Denmark'),
    new User(3, 'Marie Curie', 'marie', 'Poland/French'),
    new User(4, 'Isaac Newton', 'isaac', 'United Kingdom'),
    new User(5, 'Stephen Hawking', 'stephen', 'United Kingdom', true),
    new User(6, 'Max Planck', 'max', 'Germany'),
    new User(7, 'James Clerk Maxwell', 'james', 'United Kingdom'),
    new User(8, 'Michael Faraday', 'michael', 'United Kingdom'),
    new User(9, 'Richard Feynman', 'richard', 'USA'),
    new User(10, 'Ernest Rutherford', 'ernest', 'New Zealand'),
  ];
  filteredUsers = this.users;

  ngOnInit(): void {
    // setTimeout(() => {
    //   this.select.open();
    // }, 3000);
    this.selectValue.valueChanges.subscribe(this.onSelectionChanged);
  }

  onSearchChanged(queryString: string) {
    this.filteredUsers = this.users.filter((user) =>
      user.name.toLowerCase().startsWith(queryString.toLowerCase())
    );
  }

  displayWithFn(user: User) {
    return user.name;
  }

  compareWithFn(user: User | null, user2: User | null) {
    return user?.id === user2?.id;
  }

  onSelectionChanged(value: unknown) {
    console.log('Selected value: ', value);
  }
}
