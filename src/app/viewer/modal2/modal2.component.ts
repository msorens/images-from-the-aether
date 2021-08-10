import { Component, ElementRef, EventEmitter, Input, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// Interesting read on options for creating modals:
// https://blog.bitsrc.io/creating-modals-in-angular-cb32b126a88e

@Component({
  selector: 'app-modal2',
  templateUrl: './modal2.component.html',
  styleUrls: ['./modal2.component.scss'],
})
export class Modal2Component implements OnInit {
  /**
   * Inform the modal to display itself.
   */
  @Input() visibility: EventEmitter<boolean>;

  private isDestroyed = new Subject<boolean>();

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
    this.visibility.pipe(takeUntil(this.isDestroyed))
      .subscribe((open) => {
        if (open) {
          this.open();
        } else {
          this.close();
        }

      });
  }

  private open(): void {
    // TODO: only do this if not already present
    this.nativeElement.classList.add('visible');
  }

  private close(): void {
    this.nativeElement.classList.remove('visible');
  }
}
