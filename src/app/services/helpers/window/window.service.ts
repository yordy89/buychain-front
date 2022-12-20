/*
 * Documentation
 *
 * We don’t want to reference the global Window object directly in our Angular component
 * since our application may be used in Angular Universal, and it’s considered best practice to avoid
 * directly referencing the global objects. While you may have no plans to use Angular Universal,
 * this enables us to cleanly inject the browser’s native Window object into a component.
 *
 * This is Window provider helper service was build on top of http://brianflove.com/2018/01/11/angular-window-provider/.
 * Please use this provider to get access to window object.
 *
 * Example of usage
 * import { WINDOW } from '@services/helpers/window/window.service'
 * constructor(@Inject(WINDOW) private window: Window)
 * this.window now available in your component
 *
 */
import { isPlatformBrowser } from '@angular/common';
import { ClassProvider, FactoryProvider, InjectionToken, PLATFORM_ID, Injectable } from '@angular/core';

/*
 * Create a new injection token for injecting the window into a component.
 */
export const WINDOW = new InjectionToken('WindowToken');

/*
 * Define abstract class for obtaining reference to the global window object.
 */
export abstract class WindowRef {
  get nativeWindow(): Window | Record<string, unknown> {
    throw new Error('Not implemented.');
  }
}

/*
 * Define class that implements the abstract class and returns the native window object.
 */
@Injectable()
export class BrowserWindowRef extends WindowRef {
  constructor() {
    super();
  }

  get nativeWindow(): Window | Record<string, unknown> {
    return window;
  }
}

/*
 * Create an factory function that returns the native window object.
 */
export function windowFactory(
  browserWindowRef: BrowserWindowRef,
  platformId: Record<string, unknown>
): Window | Record<string, unknown> {
  if (isPlatformBrowser(platformId)) {
    return browserWindowRef.nativeWindow;
  }

  return {};
}

/*
 * Create a injectable provider for the WindowRef token that uses the BrowserWindowRef class.
 */
const browserWindowProvider: ClassProvider = {
  provide: WindowRef,
  useClass: BrowserWindowRef
};

/*
 * Create an injectable provider that uses the windowFactory function for returning the native window object.
 */
export const windowProvider: FactoryProvider = {
  provide: WINDOW,
  useFactory: windowFactory,
  deps: [WindowRef, PLATFORM_ID]
};

/*
 * Create an array of providers.
 */
export const WINDOW_PROVIDERS = [browserWindowProvider, windowProvider];
