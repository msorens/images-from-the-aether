import { Component, ElementRef, EventEmitter, HostListener, Input, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// Interesting read on options for creating modals:
// https://blog.bitsrc.io/creating-modals-in-angular-cb32b126a88e

@Component({
  selector: 'app-base-modal',
  templateUrl: './base-modal.component.html',
  styleUrls: ['./base-modal.component.scss'],
})
export class BaseModalComponent implements OnInit {
  /**
   * Inform the modal to display or hide itself.
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

  // HostListener OK for this simple use case but beware of performance issues with multiple uses;
  // see https://dev.to/angular/ain-t-nobody-needs-hostlistener-fg4
  // For list of key values
  // see https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values
  @HostListener('document:keyup.escape', ['$event'])
  onKeydownHandler(event: KeyboardEvent): void {
    this.close();
  }

  private open(): void {
    // NB: inherently smart enough to skip if class already present
    this.nativeElement.classList.add('visible');
  }

  private close(): void {
    this.nativeElement.classList.remove('visible');
  }
}
