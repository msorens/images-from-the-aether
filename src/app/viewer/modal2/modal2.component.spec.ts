import { Component, EventEmitter } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { Modal2Component } from './modal2.component';

@Component({
  template: `
    <div>text always displays</div>
    <app-modal2 [openEvent]="openUserModal">
      <div id="myContent">any content here...</div>
    </app-modal2>
  `,
})
class TestHostComponent {
  openUserModal = new EventEmitter();
}

describe('HostedMessageModalComponent', () => {
  let hostComponent: TestHostComponent;
  let fixture: ComponentFixture<TestHostComponent>;
  let modalComponent: Modal2Component;
  let modalElement: HTMLElement;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [TestHostComponent, Modal2Component],
      }).compileComponents();
    })
  );
  beforeEach(() => {
    fixture = TestBed.createComponent(TestHostComponent);
    hostComponent = fixture.componentInstance;
    modalComponent = fixture.debugElement.children[0].componentInstance;
    modalElement =
      fixture.debugElement.nativeElement.querySelector('app-modal2');
    modalComponent.openEvent = new EventEmitter();
  });

  it('should be created', () => {
    expect(hostComponent).toBeTruthy();
    expect(modalComponent).toBeTruthy();
  });

  it('modal opens on demand', () => {
    expect(isModalVisible()).toBeFalse();
    openModal();
    expect(isModalVisible()).toBeTrue();
  });

  it('modal closes when clicking the background', () => {
    openModal();
    expect(isModalVisible()).toBeTrue();

    getElement('.modal-background').click();

    expect(isModalVisible()).toBeFalse();
  });

  // Note that, by themselves, the next two tests would be "phantom tests":
  // the code under test could do nothing and they would still pass, proving nothing.
  // But because of the presence of the first test just above, these are not phantoms.
  // See my article "The Phantom Menace in Unit Testing" at
  //   https://www.red-gate.com/simple-talk/dotnet/software-testing/the-phantom-menace-in-unit-testing/
  it('modal does NOT close when clicking the modal body', () => {
    openModal();
    expect(isModalVisible()).toBeTrue();

    getElement('.modal-body').click();

    expect(isModalVisible()).toBeTrue();
  });

  it('modal does NOT close when clicking deeper inside the modal body', () => {
    openModal();
    expect(isModalVisible()).toBeTrue();

    getElement('#myContent').click();

    expect(isModalVisible()).toBeTrue();
  });

  function openModal(): void {
    fixture.detectChanges();
    hostComponent.openUserModal.emit(); // this is how a client directs the modal to open
  }

  function getElement(selector: string): HTMLElement {
    return fixture.nativeElement.querySelector(selector);
  }

  function isModalVisible(): boolean {
    fixture.detectChanges();
    return modalElement.classList.contains('visible');
  }
});

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

