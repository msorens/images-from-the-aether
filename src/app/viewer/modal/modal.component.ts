import { Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';

// Interesting read on options for creating modals:
// https://blog.bitsrc.io/creating-modals-in-angular-cb32b126a88e

@Component({
  selector: 'app-modal',
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.scss'],
})
export class ModalComponent implements OnInit, OnChanges {
  /**
   * Inform the modal to display or hide itself.
   */
  @Input() visible = false;

  /**
   * Inform consumer that the modal should close.
   */
  @Output() closeModal = new EventEmitter();

  private nativeElement: any;

  constructor(private element: ElementRef) {
    this.nativeElement = element.nativeElement;
  }

  ngOnInit(): void {
    const outsideModal = this.nativeElement.querySelector(
      'div.modal-background'
    );
    outsideModal.addEventListener('click', () => {
      this.close();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.visible) {
      if (changes.visible.currentValue as boolean) {
        this.nativeElement.classList.add('visible');
      } else {
        this.nativeElement.classList.remove('visible');
      }
    }
  }

  close(): void {
    this.closeModal.emit();
  }
}
