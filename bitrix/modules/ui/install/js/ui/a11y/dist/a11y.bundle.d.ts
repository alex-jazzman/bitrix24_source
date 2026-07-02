/* eslint-disable */
type InputModality = 'keyboard' | 'pointer' | 'unknown';

type PointerType = 'mouse' | 'pen' | 'touch';

type FocusTrapOptions = {
	initialFocus?: InitialFocus | InitialFocus[];
	forceInitialFocus?: boolean;
	restoreFocus?: RestoreFocus;
	preventScroll?: boolean;
	suppressFocusOnRestore?: boolean;
	isolateOutside?: boolean;
	outsideExceptionSelectors?: string[];
	looped?: boolean;
	startBoundary?: FocusBoundaryTarget;
	endBoundary?: FocusBoundaryTarget;
};

type InitialFocus = 'first-tabbable' | 'container' | string | boolean | (() => HTMLElement | null);

type RestoreFocus = boolean | string | HTMLElement | (() => HTMLElement | null);

type FocusBoundaryTarget = string | HTMLElement | (() => HTMLElement | null);

type FocusNavigatorOptions = {
	from?: HTMLElement;
	tabbableOnly?: boolean;
	wrap?: boolean;
	accept?: (el: HTMLElement) => boolean;
	preventScroll?: boolean;
	focusVisible?: boolean;
};

interface HTMLElementWithFocusTrap extends HTMLElement {
	__focusTrap?: BX.UI.Accessibility.FocusTrap;
}

type FocusZoneOptions = {
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
	focusInStrategy?: 'first' | 'closest' | 'previous' | 'initial' | ((previousFocusedElement: Element) => HTMLElement | null);
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
	onActiveDescendantChanged?: (newActiveDescendant: HTMLElement | null, previousActiveDescendant: HTMLElement | null, directlyActivated: boolean) => void;
	/**
	 * Custom callback to determine the next focusable element.
	 * If it returns undefined, the default linear navigation is used.
	 * Use `bindKeys` to control which keys trigger this callback.
	 */
	getNextFocusable?: (direction: FocusZoneDirection, from: Element | null, event: KeyboardEvent) => HTMLElement | null;
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

type FocusZoneDirection = 'previous' | 'next' | 'start' | 'end';

type AriaLivePoliteness = 'polite' | 'assertive';

type LiveAnnouncerOptions = {
	politeness?: AriaLivePoliteness;
	container?: HTMLElement;
	baseDelay?: number;
	charDelay?: number;
	maxDelay?: number;
	maxMessageLength?: number;
};

type LogCategory = 'focus-monitor' | 'focus-trap' | 'focus-zone' | 'input-modality' | 'live-announcer';

declare namespace BX.UI.Accessibility {
	/**
	 * @memberof BX.UI.Accessibility
	 */
	class FocusMonitor {
		constructor();
		static get Instance(): FocusMonitor;
		static initialize(): FocusMonitor;
		static enableDebug(): void;
		static disableDebug(): void;
		static shouldRestoreLostFocus(): boolean;
		attachIframe(iframe: HTMLIFrameElement): void;
		detachIframe(iframe: HTMLIFrameElement): void;
		restoreFocus(): void;
		getRoot(doc?: Document): HTMLElement;
		getLastInputModality(): InputModality;
		getModalityTracker(): InputModalityTracker;
	}

	/**
	 * @memberof BX.UI.Accessibility
	 */
	class InputModalityTracker {
		attach(doc: Document): void;
		detach(doc: Document): void;
		static enableDebug(): void;
		static disableDebug(): void;
		getLastModality(): InputModality;
		getLastPointerType(): PointerType | null;
		getLastNavigationKey(): string | null;
		isLastNavigationReversed(): boolean;
	}

	/**
	 * @memberof BX.UI.Accessibility
	 */
	class FocusTrap {
		constructor(container: HTMLElement, options?: FocusTrapOptions);
		static enableDebug(): void;
		static disableDebug(): void;
		activate(options?: {
			initialFocus?: boolean;
		}): void;
		deactivate(): void;
		destroy(): void;
		setLooped(flag: boolean): void;
		setPreventScroll(flag: boolean): void;
		isLooped(): boolean;
		isActive(): boolean;
		setLastFocusedElement(el: HTMLElement): void;
		captureActiveElement(): HTMLElement | null;
		contains(el: HTMLElement): boolean;
		focusFirst(options?: FocusNavigatorOptions): HTMLElement | null;
		focusLast(options?: FocusNavigatorOptions): HTMLElement | null;
		focusNext(options?: FocusNavigatorOptions): HTMLElement | null;
		focusPrevious(options?: FocusNavigatorOptions): HTMLElement | null;
		focusContainer(options?: FocusNavigatorOptions): HTMLElement;
		focusBySelector(selector: string, options?: FocusNavigatorOptions): HTMLElement | null;
		getId(): string;
		applyInitialFocus(): void;
		setRestoreFocus(restore: RestoreFocus | null): void;
		restoreFocus(): void;
	}

	const FocusTrapDirective: {
		mounted(el: HTMLElementWithFocusTrap, binding: any): void;
		updated(el: HTMLElementWithFocusTrap, binding: any): void;
		unmounted(el: HTMLElementWithFocusTrap): void;
	};

	/**
	 * @memberof BX.UI.Accessibility
	 */
	class FocusNavigator {
		static get FOCUSABLE_SELECTOR(): string;
		static getFirst(container: HTMLElement, options?: FocusNavigatorOptions): HTMLElement | null;
		static getLast(container: HTMLElement, options?: FocusNavigatorOptions): HTMLElement | null;
		static getNext(container: HTMLElement, options?: FocusNavigatorOptions): HTMLElement | null;
		static getPrevious(container: HTMLElement, options?: FocusNavigatorOptions): HTMLElement | null;
		static focusFirst(container: HTMLElement, options?: FocusNavigatorOptions): HTMLElement | null;
		static focusLast(container: HTMLElement, options?: FocusNavigatorOptions): HTMLElement | null;
		static focusNext(container: HTMLElement, options?: FocusNavigatorOptions): HTMLElement | null;
		static focusPrevious(container: HTMLElement, options?: FocusNavigatorOptions): HTMLElement | null;
		static focusContainer(container: HTMLElement, options?: FocusNavigatorOptions): HTMLElement;
		static getActiveElement(node?: Node | null): HTMLElement | null;
		static createWalker(container: HTMLElement, options?: Pick<FocusNavigatorOptions, 'tabbableOnly' | 'accept'>): TreeWalker;
		static focusBySelector(container: HTMLElement, selector: string, options?: FocusNavigatorOptions): HTMLElement | null;
		static focusTarget(target: HTMLElement | null, options?: FocusNavigatorOptions): HTMLElement | null;
		static restoreFocus(target: HTMLElement | null, options?: FocusNavigatorOptions): HTMLElement | null;
	}

	/**
	 * Manages arrow-key (and other configurable key) focus navigation among
	 * focusable elements within a container.
	 *
	 * Supports two focus models:
	 * - **Roving tabindex** (default): moves real DOM focus between elements and
	 *   maintains a single `tabindex="0"` entry point.
	 * - **Active descendant**: keeps DOM focus on a control element and manages
	 *   `aria-activedescendant` on that control.
	 *
	 * @memberof BX.UI.Accessibility
	 */
	class FocusZone {
		constructor(container: HTMLElement, options?: FocusZoneOptions);
		static enableDebug(): void;
		static disableDebug(): void;
		activate(): void;
		deactivate(): void;
		isActive(): boolean;
		getCurrentFocusedElement(): HTMLElement | null;
		refreshElements(): void;
	}

	/**
	 * @memberof BX.UI.Accessibility
	 */
	class InteractivityChecker {
		static isDisabled(element: HTMLElement): boolean;
		static isVisible(element: HTMLElement): boolean;
		static isTabbable(element: HTMLElement): boolean;
		static hasNegativeTabIndex(element: HTMLElement): boolean;
		static isFocusable(element: HTMLElement): boolean;
	}

	/**
	 * @memberof BX.UI.Accessibility
	 */
	class LiveAnnouncer {
		static enableDebug(): void;
		static disableDebug(): void;
		static announce(message: string, politeness?: AriaLivePoliteness): void;
		static destroy(): void;
		constructor(options?: LiveAnnouncerOptions);
		announce(message: string, politeness?: AriaLivePoliteness): void;
		destroy(): void;
	}

	class AccessibilityLogger {
		static enable(category?: LogCategory): void;
		static disable(category?: LogCategory): void;
		static isEnabled(category: LogCategory): boolean;
		static log(category: LogCategory, message: string, ...args: any[]): void;
		static logNode(category: LogCategory, message: string, node: HTMLElement): void;
		static warn(category: LogCategory, message: string, ...args: unknown[]): void;
	}

	const RESTORE_FOCUS_EVENT = "a11y:restore-focus";

	const FocusKeys: {
		/** Left / Right arrow keys (previous / next) */
		ArrowHorizontal: number;
		/** Up / Down arrow keys (previous / next) */
		ArrowVertical: number;
		/** J / K keys (next / previous) */
		JK: number;
		/** H / L keys (previous / next) */
		HL: number;
		/** Home / End keys (start / end) */
		HomeAndEnd: number;
		/** W / S keys (previous / next) */
		WS: number;
		/** A / D keys (previous / next) */
		AD: number;
		/** Tab key (next; Shift+Tab = previous) */
		Tab: number;
		/** PageUp / PageDown keys (start / end) */
		PageUpDown: number;
		/** Backspace key (previous) */
		Backspace: number;
		ArrowAll: number;
		HJKL: number;
		WASD: number;
		All: number;
	};

	const ActiveDescendant: {
		/** Attribute set on the currently active descendant element. */
		readonly ELEMENT_ATTR: "data-active-descendant";
		/** Attribute set on the container when it has an active descendant. */
		readonly CONTAINER_ATTR: "data-has-active-descendant";
		/** Activated by explicit keyboard navigation (`:focus-visible` equivalent). */
		readonly EXPLICIT: "activated-by-keyboard";
		/** Activated implicitly: initialization, DOM mutation, mouseover. */
		readonly IMPLICIT: "activated-by-other";
	};

	class AccessibilitySettings {
		static useFocusTrapInDialogs(): boolean;
		static restoreLostFocus(): boolean;
		static suppressFocusOnRestore(): boolean;
	}

	class VisuallyHidden extends HTMLElement {
		connectedCallback(): void;
	}
}
