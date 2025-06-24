import { Component } from '@angular/core';
import {TasksBlock} from './tasks-block/tasks-block';

@Component({
  selector: 'app-root',
  imports: [TasksBlock],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected title = 'gytpol-pagination';
}
