/**
 * backNavigation.ts
 * Unified Hardware & Browser Back Button Management System
 * Handles Android physical/gesture back button, iOS swipe-back,
 * Desktop browser back (Alt+Left, mouse back button, browser arrow),
 * and Escape key on PC/Mac.
 */

export interface BackHandlerEntry {
  id: string;
  priority: number; // Higher number executes first
  onBack: () => boolean | void; // return true if handled
}

class BackNavigationManager {
  private handlers: BackHandlerEntry[] = [];
  private historyDepth = 0;
  private isProgrammaticBack = false;
  private lastRootBackPressTime = 0;
  private exitToastListeners: Array<(show: boolean, msg?: string) => void> = [];
  private canGoBackListeners: Array<(canGoBack: boolean) => void> = [];
  private isInitialized = false;

  public init() {
    if (this.isInitialized || typeof window === 'undefined') return;
    this.isInitialized = true;

    // Push initial root guard states to prevent immediate exit on single back press
    const currentState = window.history.state;
    if (!currentState || !currentState._appNavRoot) {
      window.history.replaceState({ _appNavRoot: true, depth: 0 }, '');
      window.history.pushState({ _appNavHome: true, depth: 1 }, '');
      this.historyDepth = 1;
    } else {
      this.historyDepth = currentState.depth || 1;
    }

    // Listen to browser / device popstate
    window.addEventListener('popstate', this.handlePopState);

    // Listen to desktop keyboard shortcuts (Esc, Alt+ArrowLeft)
    window.addEventListener('keydown', this.handleKeyDown);
  }

  private handlePopState = (e: PopStateEvent) => {
    // If popstate was triggered by our own manual UI close (e.g. clicking 'X'), ignore it
    if (this.isProgrammaticBack) {
      this.isProgrammaticBack = false;
      this.notifyCanGoBack();
      return;
    }

    if (this.historyDepth > 0) {
      this.historyDepth--;
    }

    // Find and execute the highest priority active back handler
    const sortedHandlers = [...this.handlers].sort((a, b) => b.priority - a.priority);

    let handled = false;
    for (const entry of sortedHandlers) {
      try {
        const result = entry.onBack();
        if (result !== false) {
          handled = true;
          // After handling, push a state back so future back presses keep triggering popstate
          this.rearmHistoryGuard();
          break;
        }
      } catch (err) {
        console.error('Error in back handler:', err);
      }
    }

    // If no custom handler handled it, we are at the app root level
    if (!handled) {
      const now = Date.now();
      const timeSinceLastPress = now - this.lastRootBackPressTime;

      if (timeSinceLastPress < 2500) {
        // Double-press within 2.5 seconds: user genuinely wants to exit
        this.notifyExitToast(false);
        // Allow the browser to go back (or close tab/exit PWA)
        window.history.back();
      } else {
        // First back press at root: show alert toast and re-arm guard state
        this.lastRootBackPressTime = now;
        this.notifyExitToast(true, 'আরেকবার ব্যাক চাপলে অ্যাপ থেকে বের হবেন');
        this.rearmHistoryGuard();

        // Auto-hide toast after 2.5 seconds
        setTimeout(() => {
          if (Date.now() - this.lastRootBackPressTime >= 2400) {
            this.notifyExitToast(false);
          }
        }, 2500);
      }
    }

    this.notifyCanGoBack();
  };

  private handleKeyDown = (e: KeyboardEvent) => {
    // Escape key behaves as back button on PC/Mac
    if (e.key === 'Escape') {
      this.triggerBack();
    }
  };

  /**
   * Re-arms history entry so Android / browser back button continues to fire popstate
   */
  private rearmHistoryGuard() {
    try {
      window.history.pushState({ _appNavGuard: true, depth: ++this.historyDepth }, '');
    } catch {
      // Ignore if state push limit reached
    }
  }

  /**
   * Register a back handler. Returns an unregister function.
   */
  public register(id: string, priority: number, onBack: () => boolean | void): () => void {
    // Remove if already exists with same id
    this.handlers = this.handlers.filter((h) => h.id !== id);
    this.handlers.push({ id, priority, onBack });
    this.notifyCanGoBack();

    return () => {
      this.unregister(id);
    };
  }

  public unregister(id: string) {
    this.handlers = this.handlers.filter((h) => h.id !== id);
    this.notifyCanGoBack();
  }

  /**
   * Push a nav state when an overlay/drawer opens or mode changes
   */
  public pushState(id: string) {
    this.historyDepth++;
    try {
      window.history.pushState({ _navId: id, depth: this.historyDepth }, '');
    } catch {
      // ignore
    }
    this.notifyCanGoBack();
  }

  /**
   * Called when an overlay is closed manually via UI (e.g. clicking 'X' or backdrop)
   */
  public popStateIfManual() {
    if (this.historyDepth > 1) {
      this.isProgrammaticBack = true;
      this.historyDepth--;
      try {
        window.history.back();
      } catch {
        this.isProgrammaticBack = false;
      }
    }
    this.notifyCanGoBack();
  }

  /**
   * Programmatic back trigger (e.g. from in-app Back button)
   */
  public triggerBack(): boolean {
    const sortedHandlers = [...this.handlers].sort((a, b) => b.priority - a.priority);
    for (const entry of sortedHandlers) {
      try {
        const result = entry.onBack();
        if (result !== false) {
          this.notifyCanGoBack();
          return true;
        }
      } catch (err) {
        console.error('Error in triggerBack:', err);
      }
    }
    return false;
  }

  public canGoBack(): boolean {
    return this.handlers.some((h) => h.priority > 0);
  }

  public onExitToast(callback: (show: boolean, msg?: string) => void) {
    this.exitToastListeners.push(callback);
    return () => {
      this.exitToastListeners = this.exitToastListeners.filter((cb) => cb !== callback);
    };
  }

  public onCanGoBackChange(callback: (canGoBack: boolean) => void) {
    this.canGoBackListeners.push(callback);
    callback(this.canGoBack());
    return () => {
      this.canGoBackListeners = this.canGoBackListeners.filter((cb) => cb !== callback);
    };
  }

  private notifyExitToast(show: boolean, msg?: string) {
    this.exitToastListeners.forEach((cb) => cb(show, msg));
  }

  private notifyCanGoBack() {
    const can = this.canGoBack();
    this.canGoBackListeners.forEach((cb) => cb(can));
  }
}

export const backNavigation = new BackNavigationManager();

// Helper hook for React components
import { useEffect, useRef } from 'react';

export function useBackHandler(
  handler: () => boolean | void,
  priority: number,
  enabled: boolean,
  id: string
) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (!enabled) return;

    // Push history state so device back button knows an overlay/subview is active
    backNavigation.pushState(id);

    const unregister = backNavigation.register(id, priority, () => {
      return handlerRef.current();
    });

    return () => {
      unregister();
    };
  }, [enabled, priority, id]);
}
