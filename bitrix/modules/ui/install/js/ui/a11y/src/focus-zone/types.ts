export type FocusZoneDirection = 'previous' | 'next' | 'start' | 'end';

export type FocusZoneOptions = {
	/**
	 * Bit flags identifying keys bound to focus movement.
	 * Use the `FocusKeys` constants with bitwise OR to combine.
	 *
	 * Default: `FocusKeys.ArrowVertical | FocusKeys.HomeAndEnd`
	 * (or `FocusKeys.ArrowAll | FocusKeys.HomeAndEnd` when `getNextFocusable` is provided)
	 */
	bindKeys?: number;

	/**
	 * Behavior when focus reaches the first or last element.
	 * "stop" — do nothing and keep focus where it was (default)
	 * "wrap" — wrap focus around to the opposite end
	 */
	focusOutBehavior?: 'stop' | 'wrap';

	/**
	 * Strategy for determining which element receives focus when focus enters the container.
	 *
	 * "previous" — focus the most recently focused element, fallback to first (default)
	 * "first" — always focus the first element
	 * "closest" — focus the first or last element depending on entry direction
	 * "initial" — keep focus on the control; do not set active descendant until user navigates
	 *             (only valid when `activeDescendantControl` is set)
	 * function — custom callback receiving the previously focused element, returning the target
	 */
	focusInStrategy?: | 'first' | 'closest' | 'previous' | 'initial' | ((previousFocusedElement: Element) => HTMLElement | null);

	/**
	 * When provided, aria-activedescendant is managed instead of moving DOM focus.
	 * The given element receives `aria-activedescendant` pointing to the currently active
	 * descendant and an `aria-controls` attribute referencing the container's ID.
	 *
	 * @see https://www.w3.org/TR/wai-aria-practices-1.1/#kbd_focus_activedescendant
	 */
	activeDescendantControl?: HTMLElement;

	/**
	 * Called each time the active descendant changes.
	 * Either parameter may be null (e.g. on first activation or when the control blurs).
	 */
	onActiveDescendantChanged?: (
		newActiveDescendant: HTMLElement | null,
		previousActiveDescendant: HTMLElement | null,
		directlyActivated: boolean,
	) => void;

	/**
	 * Custom callback to determine the next focusable element.
	 * If it returns undefined, the default linear navigation is used.
	 * Use `bindKeys` to control which keys trigger this callback.
	 */
	getNextFocusable?: (
		direction: FocusZoneDirection,
		from: Element | null,
		event: KeyboardEvent,
	) => HTMLElement | null;

	/**
	 * Filter callback to exclude elements from focus management.
	 * Return `false` to exclude an element. By default all focusable elements participate.
	 */
	focusableElementFilter?: (element: HTMLElement) => boolean;

	/**
	 * Whether the browser should scroll the document to bring the newly-focused element
	 * into view. Default: false
	 */
	preventScroll?: boolean;

	/**
	 * When `true`, mouse hover will not change the active descendant.
	 * Only relevant when `activeDescendantControl` is set. Default: false
	 */
	ignoreHoverEvents?: boolean;

	/**
	 * When `true`, only tabbable elements (tabindex >= 0) are managed.
	 * Default: false (all focusable elements are managed)
	 */
	tabbableOnly?: boolean;
};
