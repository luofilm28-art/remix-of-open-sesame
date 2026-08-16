/**
 * Developer-tools guard.
 *
 * Blocks the usual devtools entry points, keeps the console clean and sends the
 * player back to the home screen if devtools is detected.
 *
 * Careful notes (the game is also embedded in operator sites):
 *  - It never runs during development, so building the game stays possible.
 *  - Inside an iframe the window-size heuristic is skipped, because `outerWidth`
 *    belongs to the parent page and would false-positive on every embed.
 *  - It only ever navigates its own frame — never the operator's page.
 */

let installed = false;

function isEmbedded(): boolean {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

function silenceConsole() {
  const noop = () => undefined;
  const target = window.console as unknown as Record<string, unknown>;
  for (const method of [
    "log",
    "debug",
    "info",
    "warn",
    "error",
    "table",
    "trace",
    "dir",
    "group",
    "groupCollapsed",
    "groupEnd",
  ]) {
    try {
      target[method] = noop;
    } catch {
      /* frozen console — ignore */
    }
  }
  try {
    window.console.clear();
  } catch {
    /* ignore */
  }
}

function bounceHome() {
  silenceConsole();
  try {
    if (isEmbedded()) {
      // Tell the operator shell, then reset our own frame only.
      window.parent.postMessage({ type: "aviator:devtools-blocked" }, "*");
    }
  } catch {
    /* cross-origin parent — ignore */
  }
  if (window.location.pathname !== "/") {
    window.location.replace("/");
  } else {
    window.location.reload();
  }
}

export function installDevtoolsGuard(): () => void {
  if (installed || typeof window === "undefined") return () => undefined;
  if (!import.meta.env.PROD) return () => undefined;
  installed = true;

  const onContextMenu = (event: MouseEvent) => event.preventDefault();

  const onKeyDown = (event: KeyboardEvent) => {
    const key = event.key.toLowerCase();
    const inspector =
      key === "f12" ||
      ((event.ctrlKey || event.metaKey) && event.shiftKey && ["i", "j", "c"].includes(key)) ||
      ((event.ctrlKey || event.metaKey) && key === "u");
    if (inspector) {
      event.preventDefault();
      event.stopPropagation();
      bounceHome();
    }
  };

  // Network / runtime noise must never surface in the console.
  const onError = (event: ErrorEvent) => {
    event.preventDefault();
    try {
      window.console.clear();
    } catch {
      /* ignore */
    }
  };
  const onRejection = (event: PromiseRejectionEvent) => event.preventDefault();

  window.addEventListener("contextmenu", onContextMenu);
  window.addEventListener("keydown", onKeyDown, true);
  window.addEventListener("error", onError, true);
  window.addEventListener("unhandledrejection", onRejection);

  const embedded = isEmbedded();
  const interval = window.setInterval(() => {
    try {
      window.console.clear();
    } catch {
      /* ignore */
    }
    if (embedded) return; // size heuristic is meaningless inside an iframe
    const widthGap = window.outerWidth - window.innerWidth;
    const heightGap = window.outerHeight - window.innerHeight;
    if (widthGap > 200 || heightGap > 220) bounceHome();
  }, 1500);

  return () => {
    window.removeEventListener("contextmenu", onContextMenu);
    window.removeEventListener("keydown", onKeyDown, true);
    window.removeEventListener("error", onError, true);
    window.removeEventListener("unhandledrejection", onRejection);
    window.clearInterval(interval);
    installed = false;
  };
}
