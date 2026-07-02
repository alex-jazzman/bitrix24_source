/**
 * Public type surface of the `ui.vue3.router` Bitrix extension.
 *
 * This file is referenced from `bundle.config.js` via the `types` field, so
 * `webpack.config.js` resolves the extension's design-time alias here (PhpStorm
 * uses webpack aliases for module resolution in Flow-typed `.js` files). The
 * runtime `input` (`./src/vue-router.js`) and the production bundle are
 * unaffected — `types` is read only by the IDE-facing alias generator.
 *
 * Coverage:
 *  - Core router primitives: `Router`, `RouterOptions`, `RouterHistory`,
 *    `createRouter`, `createWebHistory`, `createWebHashHistory`,
 *    `createMemoryHistory`.
 *  - Route locations: `RouteLocationRaw`, `RouteLocationNormalized`,
 *    `RouteLocationNormalizedLoaded`, `RouteLocationOptions`,
 *    `RouteLocationPathRaw`, `RouteLocationNamedRaw`, `RouteRecordRaw` and
 *    its variants (`RouteRecordSingleView`, `RouteRecordMultipleViews`,
 *    `RouteRecordRedirect`).
 *  - Navigation: `NavigationGuard`, `NavigationGuardWithThis`,
 *    `NavigationGuardNext`, `NavigationHookAfter`, `NavigationFailure`,
 *    `NavigationFailureType`, `isNavigationFailure`, `loadRouteLocation`.
 *  - Composition API: `useRouter`, `useRoute`, `useLink`,
 *    `onBeforeRouteLeave`, `onBeforeRouteUpdate`.
 *  - Components / props: `RouterView`, `RouterViewProps`, `RouterLink`,
 *    `RouterLinkProps`, `UseLinkOptions`, `UseLinkReturn`.
 *  - Query helpers: `parseQuery`, `stringifyQuery`, `LocationQuery`,
 *    `LocationQueryRaw`.
 *  - Constants: `START_LOCATION`.
 *
 * This is a *minimal* surface — sufficient for typical product usage but
 * intentionally not a 1:1 copy of vue-router's full d.ts. Less common
 * primitives (typed-routes infrastructure, matcher internals, etc.) are
 * declared as `any`-ish placeholders to keep the file readable. Extend on
 * demand.
 *
 * Source: vue-router 5.0.2 (https://github.com/vuejs/router/tree/v5.0.2).
 * If vue-router is bumped in `src/vue-router.js`, mirror the public type
 * changes here.
 */

import type {
	App,
	Component,
	ComputedRef,
	DefineComponent,
	InjectionKey,
	Ref,
	VNodeProps,
} from 'vue';

// ---------- Query / params primitives ----------

export type LocationQueryValue = string | null;
export type LocationQueryValueRaw = LocationQueryValue | number | undefined;

export interface LocationQuery
{
	[key: string]: LocationQueryValue | LocationQueryValue[];
}

export interface LocationQueryRaw
{
	[key: string]: LocationQueryValueRaw | LocationQueryValueRaw[];
}

export type RouteParamValue = string;
export type RouteParamValueRaw = RouteParamValue | number | null | undefined;

export interface RouteParams
{
	[key: string]: RouteParamValue | RouteParamValue[];
}

export interface RouteParamsRaw
{
	[key: string]: RouteParamValueRaw | Exclude<RouteParamValueRaw, null | undefined>[];
}

export type RouteRecordName = string | symbol;

export interface RouteMeta extends Record<string | number | symbol, unknown> {}

// ---------- Route record ----------

export type RouteComponent = Component | (() => Promise<Component>);

export interface _RouteRecordBase
{
	path: string;
	redirect?: RouteRecordRedirectOption;
	alias?: string | string[];
	name?: RouteRecordName;
	beforeEnter?: NavigationGuardWithThis<undefined> | NavigationGuardWithThis<undefined>[];
	meta?: RouteMeta;
	props?:
		| boolean
		| Record<string, unknown>
		| ((to: RouteLocationNormalized) => Record<string, unknown>);
	sensitive?: boolean;
	strict?: boolean;
}

export type RouteRecordRedirectOption =
	| RouteLocationRaw
	| ((to: RouteLocationNormalized) => RouteLocationRaw);

export interface RouteRecordSingleView extends _RouteRecordBase
{
	component: RouteComponent;
	components?: never;
	children?: RouteRecordRaw[];
}

export interface RouteRecordMultipleViews extends _RouteRecordBase
{
	components: Record<string, RouteComponent>;
	component?: never;
	children?: RouteRecordRaw[];
}

export interface RouteRecordRedirect extends _RouteRecordBase
{
	redirect: RouteRecordRedirectOption;
	component?: never;
	components?: never;
}

export type RouteRecordRaw = RouteRecordSingleView | RouteRecordMultipleViews | RouteRecordRedirect;

export interface RouteRecord
{
	path: string;
	redirect: RouteRecordRedirectOption | undefined;
	name: RouteRecordName | undefined;
	components: Record<string, RouteComponent> | null | undefined;
	meta: RouteMeta;
	beforeEnter:
		| _RouteRecordBase['beforeEnter']
		| undefined;
	props: Record<string, _RouteRecordBase['props']>;
	children: RouteRecord[];
	instances: Record<string, any>;
	leaveGuards: Set<NavigationGuard>;
	updateGuards: Set<NavigationGuard>;
	enterCallbacks: Record<string, Array<(vm: any) => void>>;
	aliasOf: RouteRecord | undefined;
}

export type RouteRecordNormalized = RouteRecord;
export type RouteLocationMatched = RouteRecordNormalized;

// ---------- Route locations ----------

export interface _RouteLocationBase
{
	path: string;
	fullPath: string;
	query: LocationQuery;
	hash: string;
	name: RouteRecordName | null | undefined;
	params: RouteParams;
	redirectedFrom: RouteLocation | undefined;
	meta: RouteMeta;
}

export interface RouteLocation extends _RouteLocationBase
{
	matched: RouteLocationMatched[];
}

export interface RouteLocationNormalized extends _RouteLocationBase
{
	matched: RouteLocationMatched[];
}

export interface RouteLocationNormalizedLoaded extends _RouteLocationBase
{
	matched: RouteLocationMatched[];
}

export interface RouteLocationResolved extends RouteLocationNormalized
{
	href: string;
}

export interface RouteLocationOptions
{
	replace?: boolean;
	force?: boolean;
	state?: HistoryState;
}

export interface RouteQueryAndHash
{
	query?: LocationQueryRaw;
	hash?: string;
}

export interface RouteLocationPathRaw extends RouteQueryAndHash, RouteLocationOptions
{
	path: string;
}

export interface RouteLocationNamedRaw extends RouteQueryAndHash, RouteLocationOptions
{
	name?: RouteRecordName;
	params?: RouteParamsRaw;
}

export type RouteLocationAsString = string;
export type RouteLocationAsPath = RouteLocationPathRaw;
export type RouteLocationAsRelative = RouteLocationNamedRaw;

export type RouteLocationRaw =
	| RouteLocationAsString
	| RouteLocationAsPath
	| RouteLocationAsRelative;

// ---------- History ----------

export interface HistoryState
{
	[x: number]: HistoryStateValue;
	[x: string]: HistoryStateValue;
}
export type HistoryStateValue = string | number | boolean | null | HistoryState | HistoryStateArray;
export interface HistoryStateArray extends Array<HistoryStateValue> {}

export interface RouterHistory
{
	readonly base: string;
	readonly location: string;
	readonly state: HistoryState;
	push(to: string, data?: HistoryState): void;
	replace(to: string, data?: HistoryState): void;
	go(delta: number, triggerListeners?: boolean): void;
	listen(callback: NavigationCallback): () => void;
	createHref(location: string): string;
	destroy(): void;
}

export type NavigationCallback = (
	to: string,
	from: string,
	information: { type: NavigationType; direction: NavigationDirection; delta: number },
) => void;

export type NavigationType = 'pop' | 'push';
export type NavigationDirection = 'back' | 'forward' | 'unknown' | '';

export function createWebHistory(base?: string): RouterHistory;
export function createWebHashHistory(base?: string): RouterHistory;
export function createMemoryHistory(base?: string): RouterHistory;

// ---------- Navigation guards / hooks ----------

export type Awaitable<T> = T | PromiseLike<T>;

export type NavigationGuardReturn =
	| void
	| boolean
	| Error
	| RouteLocationRaw
	| ((vm: any) => any);

export type NavigationGuardNextCallback = (vm: any) => any;

export interface NavigationGuardNext
{
	(): void;
	(error: Error): void;
	(location: RouteLocationRaw): void;
	(valid: boolean | undefined): void;
	(cb: NavigationGuardNextCallback): void;
}

export interface NavigationGuard
{
	(
		to: RouteLocationNormalized,
		from: RouteLocationNormalizedLoaded,
		next: NavigationGuardNext,
	): Awaitable<NavigationGuardReturn>;
}

export interface NavigationGuardWithThis<This>
{
	(
		this: This,
		to: RouteLocationNormalized,
		from: RouteLocationNormalizedLoaded,
		next: NavigationGuardNext,
	): Awaitable<NavigationGuardReturn>;
}

export interface NavigationHookAfter
{
	(
		to: RouteLocationNormalized,
		from: RouteLocationNormalizedLoaded,
		failure?: NavigationFailure | void,
	): any;
}

// ---------- Navigation failure ----------

export enum NavigationFailureType
{
	aborted = 4,
	cancelled = 8,
	duplicated = 16,
}

export interface NavigationFailure extends Error
{
	type:
		| NavigationFailureType.aborted
		| NavigationFailureType.cancelled
		| NavigationFailureType.duplicated;
	from: RouteLocationNormalized;
	to: RouteLocationNormalized;
}

export function isNavigationFailure(
	error: any,
	type?: number,
): error is NavigationFailure;

// ---------- Router ----------

export type RouterScrollBehavior = (
	to: RouteLocationNormalized,
	from: RouteLocationNormalizedLoaded,
	savedPosition: { left: number; top: number; behavior?: ScrollBehavior } | null,
) => Awaitable<{ left?: number; top?: number; el?: string | Element; behavior?: ScrollBehavior } | false | void>;

export interface RouterOptions
{
	history: RouterHistory;
	routes: readonly RouteRecordRaw[];
	scrollBehavior?: RouterScrollBehavior;
	parseQuery?: typeof parseQuery;
	stringifyQuery?: typeof stringifyQuery;
	linkActiveClass?: string;
	linkExactActiveClass?: string;
	sensitive?: boolean;
	strict?: boolean;
}

export interface Router
{
	readonly currentRoute: Ref<RouteLocationNormalizedLoaded>;
	readonly options: RouterOptions;
	readonly listening: boolean;

	addRoute(parentName: RouteRecordName, route: RouteRecordRaw): () => void;
	addRoute(route: RouteRecordRaw): () => void;
	removeRoute(name: RouteRecordName): void;
	hasRoute(name: RouteRecordName): boolean;
	getRoutes(): RouteRecord[];

	resolve(to: RouteLocationRaw, currentLocation?: RouteLocationNormalizedLoaded): RouteLocationResolved;

	push(to: RouteLocationRaw): Promise<NavigationFailure | void | undefined>;
	replace(to: RouteLocationRaw): Promise<NavigationFailure | void | undefined>;
	back(): ReturnType<Router['go']>;
	forward(): ReturnType<Router['go']>;
	go(delta: number): Promise<NavigationFailure | void | undefined>;

	beforeEach(guard: NavigationGuardWithThis<undefined>): () => void;
	beforeResolve(guard: NavigationGuardWithThis<undefined>): () => void;
	afterEach(guard: NavigationHookAfter): () => void;

	onError(handler: (error: any, to: RouteLocationNormalized, from: RouteLocationNormalizedLoaded) => any): () => void;
	isReady(): Promise<void>;

	install(app: App): void;
}

export function createRouter(options: RouterOptions): Router;

export function loadRouteLocation(route: RouteLocationRaw): Promise<RouteLocationNormalizedLoaded>;

export const START_LOCATION: RouteLocationNormalizedLoaded;

// ---------- Composition API ----------

export function useRouter(): Router;
export function useRoute(): RouteLocationNormalizedLoaded;

export interface UseLinkOptions
{
	to: RouteLocationRaw | Ref<RouteLocationRaw> | ComputedRef<RouteLocationRaw>;
	replace?: boolean | Ref<boolean | undefined> | ComputedRef<boolean | undefined>;
}

export interface UseLinkReturn
{
	route: ComputedRef<RouteLocationResolved>;
	href: ComputedRef<string>;
	isActive: ComputedRef<boolean>;
	isExactActive: ComputedRef<boolean>;
	navigate(e?: MouseEvent): Promise<NavigationFailure | void | undefined>;
}

export function useLink(props: UseLinkOptions): UseLinkReturn;

export function onBeforeRouteLeave(leaveGuard: NavigationGuard): void;
export function onBeforeRouteUpdate(updateGuard: NavigationGuard): void;

// ---------- Query parsing ----------

export function parseQuery(search: string): LocationQuery;
export function stringifyQuery(query: LocationQueryRaw): string;

// ---------- Components ----------

export interface RouterLinkProps
{
	to: RouteLocationRaw;
	replace?: boolean;
	activeClass?: string;
	exactActiveClass?: string;
	custom?: boolean;
	ariaCurrentValue?: 'page' | 'step' | 'location' | 'date' | 'time' | 'true' | 'false';
}

export interface RouterViewProps
{
	name?: string;
	route?: RouteLocationNormalized;
}

export const RouterLink: DefineComponent<RouterLinkProps>;
export const RouterView: DefineComponent<RouterViewProps>;

// ---------- Injection keys (advanced usage) ----------

export const routerKey: InjectionKey<Router>;
export const routeLocationKey: InjectionKey<RouteLocationNormalizedLoaded>;
export const routerViewLocationKey: InjectionKey<Ref<RouteLocationNormalizedLoaded>>;
export const matchedRouteKey: InjectionKey<ComputedRef<RouteRecordNormalized | undefined>>;
export const viewDepthKey: InjectionKey<Ref<number>>;

// ---------- Augment Vue instance type with $router / $route ----------

declare module 'vue'
{
	interface ComponentCustomProperties
	{
		$router: Router;
		$route: RouteLocationNormalizedLoaded;
	}

	interface ComponentCustomOptions
	{
		beforeRouteEnter?: NavigationGuardWithThis<undefined>;
		beforeRouteUpdate?: NavigationGuard;
		beforeRouteLeave?: NavigationGuard;
	}
}

// ---------- Ambient namespace form (BX.Vue3.VueRouter.*) ----------
//
// Mirrors the module form so `.d.ts` files of other Bitrix extensions can
// reference vue-router types as `BX.Vue3.VueRouter.Router` etc. without
// `import('ui.vue3.router')`. The IIFE wrap names the global `BX.Vue3.VueRouter`
// (see `bundle.config.js: namespace`), so we mirror the same name here.

declare global
{
	namespace BX
	{
		namespace Vue3
		{
			namespace VueRouter
			{
				type Router = import('ui.vue3.router').Router;
				type RouterOptions = import('ui.vue3.router').RouterOptions;
				type RouterHistory = import('ui.vue3.router').RouterHistory;

				type RouteLocationRaw = import('ui.vue3.router').RouteLocationRaw;
				type RouteLocation = import('ui.vue3.router').RouteLocation;
				type RouteLocationNormalized = import('ui.vue3.router').RouteLocationNormalized;
				type RouteLocationNormalizedLoaded = import('ui.vue3.router').RouteLocationNormalizedLoaded;
				type RouteLocationResolved = import('ui.vue3.router').RouteLocationResolved;
				type RouteLocationOptions = import('ui.vue3.router').RouteLocationOptions;
				type RouteLocationAsString = import('ui.vue3.router').RouteLocationAsString;
				type RouteLocationAsPath = import('ui.vue3.router').RouteLocationAsPath;
				type RouteLocationAsRelative = import('ui.vue3.router').RouteLocationAsRelative;
				type RouteLocationPathRaw = import('ui.vue3.router').RouteLocationPathRaw;
				type RouteLocationNamedRaw = import('ui.vue3.router').RouteLocationNamedRaw;

				type RouteRecord = import('ui.vue3.router').RouteRecord;
				type RouteRecordRaw = import('ui.vue3.router').RouteRecordRaw;
				type RouteRecordName = import('ui.vue3.router').RouteRecordName;
				type RouteRecordNormalized = import('ui.vue3.router').RouteRecordNormalized;
				type RouteRecordSingleView = import('ui.vue3.router').RouteRecordSingleView;
				type RouteRecordMultipleViews = import('ui.vue3.router').RouteRecordMultipleViews;
				type RouteRecordRedirect = import('ui.vue3.router').RouteRecordRedirect;
				type RouteRecordRedirectOption = import('ui.vue3.router').RouteRecordRedirectOption;

				type RouteParams = import('ui.vue3.router').RouteParams;
				type RouteParamsRaw = import('ui.vue3.router').RouteParamsRaw;
				type RouteParamValue = import('ui.vue3.router').RouteParamValue;
				type RouteParamValueRaw = import('ui.vue3.router').RouteParamValueRaw;
				type RouteMeta = import('ui.vue3.router').RouteMeta;
				type RouteComponent = import('ui.vue3.router').RouteComponent;

				type LocationQuery = import('ui.vue3.router').LocationQuery;
				type LocationQueryRaw = import('ui.vue3.router').LocationQueryRaw;
				type LocationQueryValue = import('ui.vue3.router').LocationQueryValue;
				type LocationQueryValueRaw = import('ui.vue3.router').LocationQueryValueRaw;

				type NavigationGuard = import('ui.vue3.router').NavigationGuard;
				type NavigationGuardWithThis<This> = import('ui.vue3.router').NavigationGuardWithThis<This>;
				type NavigationGuardNext = import('ui.vue3.router').NavigationGuardNext;
				type NavigationGuardNextCallback = import('ui.vue3.router').NavigationGuardNextCallback;
				type NavigationGuardReturn = import('ui.vue3.router').NavigationGuardReturn;
				type NavigationHookAfter = import('ui.vue3.router').NavigationHookAfter;
				type NavigationFailure = import('ui.vue3.router').NavigationFailure;
				type NavigationFailureType = import('ui.vue3.router').NavigationFailureType;

				type RouterScrollBehavior = import('ui.vue3.router').RouterScrollBehavior;

				type RouterLinkProps = import('ui.vue3.router').RouterLinkProps;
				type RouterViewProps = import('ui.vue3.router').RouterViewProps;
				type UseLinkOptions = import('ui.vue3.router').UseLinkOptions;
				type UseLinkReturn = import('ui.vue3.router').UseLinkReturn;

				type HistoryState = import('ui.vue3.router').HistoryState;
				type HistoryStateValue = import('ui.vue3.router').HistoryStateValue;
				type Awaitable<T> = import('ui.vue3.router').Awaitable<T>;
			}
		}
	}
}
