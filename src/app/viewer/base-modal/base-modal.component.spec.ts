import { Component, EventEmitter } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { find, setFixture } from 'src/app/utility/queryHelper';
import { BaseModalComponent } from './base-modal.component';

@Component({
  template: `
    <div>text always displays</div>
    <app-base-modal [visibility]="visibilityControl">
      <div id="myContent">any content here...</div>
    </app-base-modal>
  `,
})
class TestHostComponent {
  visibilityControl = new EventEmitter<boolean>();
}

describe('BaseModalComponent', () => {
  let hostComponent: TestHostComponent;
  let fixture: ComponentFixture<TestHostComponent>;
  let modalComponent: BaseModalComponent;
  let modalElement: HTMLElement;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [TestHostComponent, BaseModalComponent],
      }).compileComponents();
    })
  );
  beforeEach(() => {
    fixture = TestBed.createComponent(TestHostComponent);
    setFixture(fixture);
    hostComponent = fixture.componentInstance;
    modalComponent = fixture.debugElement.children[0].componentInstance;
    modalElement = find('app-base-modal') as HTMLElement;
    modalComponent.visibility = new EventEmitter<boolean>();
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

  it('modal can be closed on demand', () => {
    openModal();
    expect(isModalVisible()).toBeTrue();

    closeModal();
    expect(isModalVisible()).toBeFalse();
  });

  it('modal closes itself when clicking the background', () => {
    openModal();
    expect(isModalVisible()).toBeTrue();

    find('.modal-background')?.click();

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

    find('.modal-body')?.click();

    expect(isModalVisible()).toBeTrue();
  });

  it('modal does NOT close when clicking deeper inside the modal body', () => {
    openModal();
    expect(isModalVisible()).toBeTrue();

    find('#myContent')?.click();

    expect(isModalVisible()).toBeTrue();
  });

  it('modal closes itself upon pressing "escape"', () => {
    openModal();
    expect(isModalVisible()).toBeTrue();

    document.dispatchEvent(new KeyboardEvent('keyup', { key: 'escape' }));
    fixture.detectChanges();

    expect(isModalVisible()).toBeFalse();
  });

  it('modal does NOT close upon pressing keys other than "escape"', () => {
    openModal();
    expect(isModalVisible()).toBeTrue();

    [
      'c', // alphabetic
      '5', // numeric
      '.', // punctuation
      '+', // special
      ' ', // whitespace
      'enter',
      'tab'
    ].forEach(ch => {
      document.dispatchEvent(new KeyboardEvent('keyup', { key: ch }));
      fixture.detectChanges();
      expect(isModalVisible()).toBeTrue();
    });

  });

  function openModal(): void {
    fixture.detectChanges();
    hostComponent.visibilityControl.emit(true);
  }

  function closeModal(): void {
    fixture.detectChanges();
    hostComponent.visibilityControl.emit(false);
  }

  function isModalVisible(): boolean {
    fixture.detectChanges();
    return modalElement.classList.contains('visible');
  }
});
