import { Type } from 'main.core';
import { FocusMonitor, FocusNavigator } from 'ui.a11y';

type FocusScheduler = {
	schedule: (callback: () => void) => number;
	cancel: (handle: number) => void;
};

type FocusWindowOptions = {
	force?: boolean;
};

type WindowFocusScopeOptions = {
	scheduler?: FocusScheduler;
};

const frameScheduler: FocusScheduler = {
	schedule: (callback) => requestAnimationFrame(callback),
	cancel: (handle) => cancelAnimationFrame(handle),
};

/**
 * Owns the focus state of the call window: who opened it, when focus enters it and where focus goes
 * back on close. Passive by design: it subscribes to nothing, gets the root as an argument and knows
 * nothing about the window markup.
 */
export class WindowFocusScope
{
	#opener: HTMLElement | null = null;
	#handle: number | null = null;
	#destroyed: boolean = false;
	#scheduler: FocusScheduler;

	constructor(options: WindowFocusScopeOptions = {})
	{
		// Injected so unit tests drive the frame themselves: a real rAF may never fire in a throttled
		// or backgrounded test browser.
		this.#scheduler = options.scheduler ?? frameScheduler;
	}

	/**
	 * Captured once per window lifetime: a repeated call keeps the first live opener, so a re-show
	 * or an unfold cannot overwrite it.
	 */
	captureOpener(candidate: HTMLElement | null): void
	{
		if (this.#destroyed || this.#opener?.isConnected)
		{
			return;
		}

		this.#opener = WindowFocusScope.#isValidOpener(candidate) ? candidate : null;
	}

	focusWindow(root: HTMLElement | null, options: FocusWindowOptions = {}): void
	{
		if (this.#destroyed || !root)
		{
			return;
		}

		// Cancelled before any check: a rejected repeat must not leave an earlier entry standing.
		this.#cancelScheduledFocus();

		const force = options.force === true;

		this.#handle = this.#scheduler.schedule(() => {
			this.#handle = null;

			if (this.#destroyed || !root.isConnected)
			{
				return;
			}

			// Checked inside the frame, not before it: a promo opening from a microtask after this
			// call was scheduled must keep the focus it took.
			if (!force && !this.#mayTakeFocus(root))
			{
				return;
			}

			root.focus({ preventScroll: true });
		});
	}

	/**
	 * Runs while the root is still in the document, for a window that is being closed. Focus sitting
	 * outside the window is left where it is; focus of our own goes back to the captured opener,
	 * which is consumed here.
	 *
	 * @returns true when the caller must run restoreAfterDetach() once the root is out of the
	 *          document: the focus was ours and the addressed restore did not settle it.
	 */
	restoreBeforeDetach(root: HTMLElement | null): boolean
	{
		if (this.#destroyed)
		{
			return false;
		}

		// Symmetric to the yielding entry: a user who walked away to the chat keeps their focus.
		if (!WindowFocusScope.#focusIsOursToMove(root))
		{
			this.#opener = null;

			return false;
		}

		const opener = this.#opener;
		// Released before restoring: a late destroy of a superseded window must move nothing.
		this.#opener = null;

		if (!WindowFocusScope.#isUsableOpener(opener, root))
		{
			return true;
		}

		FocusNavigator.restoreFocus(opener, { preventScroll: true });

		// Checked by fact: restoreFocus moves nothing when a listener cancels the restore event.
		return document.activeElement !== opener;
	}

	/**
	 * Runs while the root is still in the document, for a window that is being folded away rather
	 * than closed. Yields exactly like restoreBeforeDetach: focus sitting outside the window is left
	 * where it is. Unlike restoreBeforeDetach it keeps the captured opener (the window lives on and
	 * still needs it to return focus when the call ends) and never restores focus by itself.
	 *
	 * @returns true when the caller must run restoreAfterDetach() once the root is out of the
	 *          document: the focus was ours and nothing here moved it.
	 */
	releaseBeforeDetach(root: HTMLElement | null): boolean
	{
		if (this.#destroyed)
		{
			return false;
		}

		return WindowFocusScope.#focusIsOursToMove(root);
	}

	/**
	 * Runs only after the root left the document (see ALG-02): while it is still there the history
	 * resolves to a node inside the dying window, the root itself included.
	 */
	restoreAfterDetach(): void
	{
		if (this.#destroyed)
		{
			return;
		}

		FocusMonitor.Instance.restoreFocus();
	}

	destroy(): void
	{
		this.#destroyed = true;
		this.#cancelScheduledFocus();
		this.#opener = null;
	}

	#mayTakeFocus(root: HTMLElement): boolean
	{
		if (WindowFocusScope.#focusIsOursToMove(root))
		{
			return true;
		}

		// Dead while the null branch of #focusIsOursToMove stands: kept so reordering it cannot make
		// "both null" a match.
		return this.#opener !== null && FocusNavigator.getActiveElement() === this.#opener;
	}

	#cancelScheduledFocus(): void
	{
		if (this.#handle !== null)
		{
			this.#scheduler.cancel(this.#handle);
			this.#handle = null;
		}
	}

	static #focusIsOursToMove(root: HTMLElement | null): boolean
	{
		const active = FocusNavigator.getActiveElement();

		if (active === null || active === document.body)
		{
			return true;
		}

		return WindowFocusScope.#rootHoldsFocus(root, active);
	}

	static #rootHoldsFocus(root: HTMLElement | null, active: HTMLElement | null): boolean
	{
		if (root === null)
		{
			return false;
		}

		// getActiveElement() unfolds the focus into a same-origin iframe: a document editor open in the
		// window reports a node from another document, while the root contains the <iframe> itself.
		const raw = document.activeElement;

		return root.contains(active) || root.contains(raw);
	}

	static #isUsableOpener(opener: HTMLElement | null, root: HTMLElement | null): boolean
	{
		if (!opener || !opener.isConnected || opener === document.body)
		{
			return false;
		}

		// The window is never its own opener: checked against the root we were given, not a selector.
		return root === null || !root.contains(opener);
	}

	static #isValidOpener(candidate: HTMLElement | null): candidate is HTMLElement
	{
		if (!candidate || candidate === document.body || !Type.isElementNode(candidate))
		{
			return false;
		}

		return candidate.isConnected;
	}
}
