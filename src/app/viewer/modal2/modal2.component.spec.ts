import { EventEmitter } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Modal2Component } from './modal2.component';

describe('ModalComponent', () => {
  let component: Modal2Component;
  let fixture: ComponentFixture<Modal2Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ Modal2Component ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(Modal2Component);
    component = fixture.componentInstance;
    component.openEvent = new EventEmitter();
    fixture.detectChanges();
  });

  it('creates a component', () => {
    expect(component).toBeTruthy();
  });
});
