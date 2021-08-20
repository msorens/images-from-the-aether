import { ComponentFixture } from '@angular/core/testing';

let fixture: ComponentFixture<any>;

// always call this first to provide context!
export function setFixture(userFixture: ComponentFixture<any>): void {
  fixture = userFixture;
}

// return a single element matching the CSS selector.
export function find(selector: string): HTMLElement | null {
  return (fixture.nativeElement as HTMLElement).querySelector(selector);
}

// return a single element matching the CSS selector and coerce to type T.
export function findAs<T extends HTMLElement>(selector: string): T {
  return (fixture.nativeElement as HTMLElement).querySelector(selector) as T;
}

// return the parent of the element matching the CSS selector as type T.
export function findParentAs<T extends HTMLElement>(selector: string): T {
  return (fixture.nativeElement as HTMLElement).querySelector(selector)
    ?.parentElement as T;
}

// return all elements matching the CSS selector as an array of type T.
export function findAllAs<T extends HTMLElement>(selector: string): T[] {
  return Array.from(
    (fixture.nativeElement as HTMLElement).querySelectorAll(selector)
  ).map((e) => e as T);
}

// return a single element from a matching collection differentiated by text content "text".
export function findOneAs<T extends HTMLElement>(
  selector: string,
  text: string
): T | null {
  const results = Array.from(
    (fixture.nativeElement as HTMLElement).querySelectorAll(selector)
  )
    .map((e) => e as T)
    .find((e) => e.textContent && e.textContent.indexOf(text) >= 0);
  return results === undefined ? null : results;
}
