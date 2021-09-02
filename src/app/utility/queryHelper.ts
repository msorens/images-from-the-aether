import { ComponentFixture } from '@angular/core/testing';

let element: HTMLElement;

// always call this first to provide context!
export function setFixture(fixture: ComponentFixture<any>): void {
  element = fixture.nativeElement;
}

export type cssSelector = string;

// return a single element matching the CSS selector.
export function find(selector: cssSelector): HTMLElement | null {
  return element.querySelector(selector);
}

// return a single element matching the CSS selector and coerce to type T.
export function findAs<T extends HTMLElement>(selector: cssSelector): T {
  return element.querySelector(selector) as T;
}

// return the parent of the element matching the CSS selector as type T.
export function findParentAs<T extends HTMLElement>(selector: cssSelector): T {
  return element.querySelector(selector)?.parentElement as T;
}

// return all elements matching the CSS selector as an array of type T.
export function findAllAs<T extends HTMLElement>(selector: cssSelector): T[] {
  return Array.from(element.querySelectorAll(selector))
    .map((e) => e as T);
}

// return a single element from a collection differentiated by specified text content.
// can feed an element array or a CSS selector as input.
export function findOneAs<T extends HTMLElement>(
  target: cssSelector | T[],
  text: string
): T | null {
  const elements: T[] = (typeof(target) === 'string')
    ? Array.from(element.querySelectorAll(target as string))
    : target;
  return elements.find(e => e.textContent && e.textContent.indexOf(text) >= 0) || null;
}
