import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TasksBlock } from './tasks-block';

describe('TasksBlock', () => {
  let component: TasksBlock;
  let fixture: ComponentFixture<TasksBlock>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TasksBlock]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TasksBlock);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
