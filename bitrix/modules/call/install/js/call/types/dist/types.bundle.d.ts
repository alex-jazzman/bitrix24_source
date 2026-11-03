/* eslint-disable */
/**
 * Temporary type stubs for Vue.
 *
 * TODO: [call-ts] replace with real types from ui.vue3
 * when proper type declarations become available.
 */
/**
 * Minimal Vue application instance.
 * @see VueCreateAppResult in ui.vue3.d.ts
 */
type VueApp = {
	config: {
		globalProperties: Record<string, unknown>;
	};
	provide(key: string | symbol, value: unknown): VueApp;
	use(plugin: unknown, ...options: unknown[]): VueApp;
	mount(rootContainer: string | Element): unknown;
	unmount(): void;
	component(name: string, definition: unknown): VueApp;
};

/**
 * Localization function injected by LocPlugin (call.plugin.loc).
 * Available as this.loc via inject or this.$loc via globalProperties.
 * All components should use this instead of this.$Bitrix.Loc.getMessage().
 */
type LocFunction = (messageId: string, replacements?: Record<string, string>) => string;

/**
 * Standard $emit available in every Vue component.
 */
interface VueEmit {
	$emit: (event: string, ...args: unknown[]) => void;
}

/**
 * Next-tick scheduling.
 */
interface VueNextTick {
	$nextTick: (fn: () => void) => void;
}

/**
 * Named slots record.
 */
interface VueSlots {
	$slots: Record<string, unknown>;
}

/**
 * Internal Vue instance — used for "inProps" computed pattern
 * (reading actually-passed vnode props).
 */
interface VueInternalInstance {
	$: {
		vnode: {
			props: Record<string, unknown> | null;
		};
	};
	$props: Record<string, unknown>;
}

/**
 * Minimal popup component ref shape (UiPopup from ui.vue3.components.popup).
 */
interface PopupRef {
	adjustPosition: () => void;
}

/**
 * Generic child component ref with optional show/setCorner.
 * `show` accepts any target that CallPopup can resolve to a bind element
 * (HTMLElement, Event, Vue component instance, $refs array, etc.).
 */
interface ComponentRef {
	$el: HTMLElement;
	show?: (target?: unknown) => void;
	setCorner?: (isActive: boolean) => void;
}
