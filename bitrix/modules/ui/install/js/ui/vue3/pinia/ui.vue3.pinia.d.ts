/**
 * Public type surface of the `ui.vue3.pinia` Bitrix extension.
 *
 * This file is referenced from `bundle.config.js` via the `types` field, so
 * `webpack.config.js` resolves the extension's design-time alias here (PhpStorm
 * uses webpack aliases for module resolution in Flow-typed `.js` files). The
 * runtime `input` (`./src/pinia.js`) and the production bundle are unaffected —
 * `types` is read only by the IDE-facing alias generator.
 *
 * Structure:
 *  - the entire Pinia 3 public API is re-declared inline so consumers get the
 *    same generics as the upstream pinia@3.0.4 typings: `Pinia`, `Store`,
 *    `StoreDefinition`, `defineStore`, `createPinia`, `mapState`/`mapGetters`/
 *    `mapActions`/`mapStores`/`mapWritableState`, `storeToRefs`,
 *    `MutationType`, plugin/subscription primitives. Types are inlined
 *    (rather than re-exported from `pinia`) for parity with `ui.vue3.vuex`,
 *    so this file stays self-contained when the host project doesn't
 *    install pinia as an npm dependency.
 *  - Vue's `ComponentCustomProperties` is augmented with `$pinia` (mirroring
 *    pinia's own augment in `dist/pinia.d.ts`).
 *  - `BX.Vue3.Pinia.*` ambient namespace is declared globally for `.d.ts`
 *    consumers that need to reference Pinia types without an explicit import.
 *
 * Source: pinia 3.0.4 (https://github.com/vuejs/pinia/tree/v3.0.4).
 * If pinia is bumped in `src/pinia.js`, mirror the public type changes here.
 */

import type {
	App,
	ComputedRef,
	DebuggerEvent,
	Ref,
	ToRef,
	ToRefs,
	UnwrapRef,
	WatchOptions,
	WritableComputedRef,
} from 'vue';

// ---------- Pinia 3 core API ----------

/**
 * Creates a Pinia instance to be used by the application.
 */
export function createPinia(): Pinia;

/**
 * Dispose a Pinia instance by stopping its effectScope and removing the state,
 * plugins and stores. Once disposed, the pinia instance cannot be used anymore.
 */
export function disposePinia(pinia: Pinia): void;

/**
 * Get the currently active pinia if there is any.
 */
export const getActivePinia: () => Pinia | undefined;

interface _SetActivePinia
{
	(pinia: Pinia): Pinia;
	(pinia: undefined): undefined;
	(pinia: Pinia | undefined): Pinia | undefined;
}

/**
 * Sets or unsets the active pinia. Used in SSR and internally when calling
 * actions and getters.
 */
export const setActivePinia: _SetActivePinia;

/**
 * Every application must own its own pinia to be able to create stores.
 */
export interface Pinia
{
	install: (app: App) => void;
	state: Ref<Record<string, StateTree>>;
	use(plugin: PiniaPlugin): Pinia;
}

/**
 * Generic state of a store.
 */
export type StateTree = Record<PropertyKey, any>;

/**
 * Generic type for a function that can infer arguments and return type.
 * For internal use **only**.
 */
export type _Method = (...args: any[]) => any;

/**
 * Type of an object of Actions. For internal usage only.
 * For internal use **only**.
 */
export type _ActionsTree = Record<string, _Method>;

/**
 * Type of an object of Getters that infers the argument. For internal usage only.
 * For internal use **only**.
 */
export type _GettersTree<S extends StateTree> =
	Record<string, ((state: UnwrapRef<S> & UnwrapRef<PiniaCustomStateProperties<S>>) => any) | (() => any)>;

/**
 * Recursive `Partial<T>`. Used by {@link Store['$patch']}.
 * For internal use **only**.
 */
export type _DeepPartial<T> = {
	[K in keyof T]?: _DeepPartial<T[K]>;
};

/**
 * Internal utility type
 */
type _IfEquals<X, Y, A = true, B = false> =
	(<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2 ? A : B;

/**
 * Internal utility type
 */
type _IsReadonly<T, K extends keyof T> = _IfEquals<
	{ [P in K]: T[P] },
	{ -readonly [P in K]: T[P] },
	false,
	true
>;

// ---------- Store types ----------

/**
 * Properties of a store.
 */
export interface StoreProperties<Id extends string>
{
	$id: Id;
	_customProperties: Set<string>;
}

/**
 * Base store with state and functions. Should not be used directly.
 */
export interface _StoreWithState<Id extends string, S extends StateTree, G, A>
	extends StoreProperties<Id>
{
	$state: UnwrapRef<S> & PiniaCustomStateProperties<S>;
	$patch(partialState: _DeepPartial<UnwrapRef<S>>): void;
	$patch<F extends (state: UnwrapRef<S>) => any>(
		stateMutator: ReturnType<F> extends Promise<any> ? never : F,
	): void;
	$reset(): void;
	$subscribe(
		callback: SubscriptionCallback<S>,
		options?: { detached?: boolean } & WatchOptions,
	): () => void;
	$onAction(callback: StoreOnActionListener<Id, S, G, A>, detached?: boolean): () => void;
	$dispose(): void;
}

/**
 * Store augmented for actions. For internal usage only.
 * For internal use **only**.
 */
export type _StoreWithActions<A> = {
	[k in keyof A]: A[k] extends (...args: infer P) => infer R ? (...args: P) => R : never;
};

/**
 * Store augmented with readonly getters. For internal usage **only**.
 */
type _StoreWithGetters_Readonly<G> = {
	readonly [K in keyof G as G[K] extends (...args: any[]) => any
		? K
		: ComputedRef extends G[K] ? K : never
	]: G[K] extends (...args: any[]) => infer R ? R : UnwrapRef<G[K]>;
};

/**
 * Store augmented with writable getters. For internal usage **only**.
 */
type _StoreWithGetters_Writable<G> = {
	[K in keyof G as G[K] extends WritableComputedRef<any> ? K : never]:
		G[K] extends Readonly<WritableComputedRef<infer R>> ? R : never;
};

/**
 * Store augmented with getters. For internal usage only.
 * For internal use **only**.
 */
export type _StoreWithGetters<G> = _StoreWithGetters_Readonly<G> & _StoreWithGetters_Writable<G>;

/**
 * Interface to be extended by the user when they add properties through plugins.
 */
export interface PiniaCustomProperties<
	Id extends string = string,
	S extends StateTree = StateTree,
	G = _GettersTree<S>,
	A = _ActionsTree,
> {}

/**
 * Properties that are added to every `store.$state` by `pinia.use()`.
 */
export interface PiniaCustomStateProperties<S extends StateTree = StateTree> {}

/**
 * Store type to build a store.
 */
export type Store<
	Id extends string = string,
	S extends StateTree = {},
	G = {},
	A = {},
> = _StoreWithState<Id, S, G, A>
	& UnwrapRef<S>
	& _StoreWithGetters<G>
	& (_ActionsTree extends A ? {} : A)
	& PiniaCustomProperties<Id, S, G, A>
	& PiniaCustomStateProperties<S>;

/**
 * Generic and type-unsafe version of Store. Doesn't fail on access with strings,
 * making it much easier to write generic functions that do not care about the
 * kind of store that is passed.
 */
export type StoreGeneric = Store<string, StateTree, _GettersTree<StateTree>, _ActionsTree>;

/**
 * Return type of `defineStore()`. Function that allows instantiating a store.
 */
export interface StoreDefinition<
	Id extends string = string,
	S extends StateTree = StateTree,
	G = _GettersTree<S>,
	A = _ActionsTree,
>
{
	(pinia?: Pinia | null | undefined, hot?: StoreGeneric): Store<Id, S, G, A>;
	$id: Id;
}

/**
 * Return type of `defineStore()` with a setup function.
 */
export interface SetupStoreDefinition<Id extends string, SS>
	extends StoreDefinition<
		Id,
		_ExtractStateFromSetupStore<SS>,
		_ExtractGettersFromSetupStore<SS>,
		_ExtractActionsFromSetupStore<SS>
	> {}

/**
 * Extract the actions of a store type. Works with both a Setup Store or an
 * Options Store.
 */
export type StoreActions<SS> = SS extends Store<string, StateTree, _GettersTree<StateTree>, infer A>
	? A
	: _ExtractActionsFromSetupStore<SS>;

/**
 * Extract the getters of a store type. Works with both a Setup Store or an
 * Options Store.
 */
export type StoreGetters<SS> = SS extends Store<string, StateTree, infer G, _ActionsTree>
	? _StoreWithGetters<G>
	: _ExtractGettersFromSetupStore<SS>;

/**
 * Extract the state of a store type. Works with both a Setup Store or an
 * Options Store. Note this unwraps refs.
 */
export type StoreState<SS> = SS extends Store<string, infer S, _GettersTree<StateTree>, _ActionsTree>
	? UnwrapRef<S>
	: _ExtractStateFromSetupStore<SS>;

// ---------- defineStore ----------

/**
 * Options passed to `defineStore()` that are common between option and setup
 * stores. Extend this interface if you want to add custom options to both kinds
 * of stores.
 */
export interface DefineStoreOptionsBase<S extends StateTree, Store> {}

/**
 * Options parameter of `defineStore()` for option stores.
 */
export interface DefineStoreOptions<Id extends string, S extends StateTree, G, A>
	extends DefineStoreOptionsBase<S, Store<Id, S, G, A>>
{
	id: Id;
	state?: () => S;
	getters?: G & ThisType<UnwrapRef<S> & _StoreWithGetters<G> & PiniaCustomProperties> & _GettersTree<S>;
	actions?: A & ThisType<
		A & UnwrapRef<S> & _StoreWithState<Id, S, G, A> & _StoreWithGetters<G> & PiniaCustomProperties
	>;
	hydrate?(storeState: UnwrapRef<S>, initialState: UnwrapRef<S>): void;
}

/**
 * Options parameter of `defineStore()` for setup stores.
 */
export interface DefineSetupStoreOptions<Id extends string, S extends StateTree, G, A>
	extends DefineStoreOptionsBase<S, Store<Id, S, G, A>>
{
	actions?: A;
}

/**
 * Available `options` when creating a pinia plugin.
 */
export interface DefineStoreOptionsInPlugin<Id extends string, S extends StateTree, G, A>
	extends Omit<DefineStoreOptions<Id, S, G, A>, 'id' | 'actions'>
{
	actions: A;
}

interface SetupStoreHelpers
{
	action: <Fn extends _Method>(fn: Fn, name?: string) => Fn;
}

/**
 * For internal use **only**.
 */
export type _ExtractActionsFromSetupStore_Keys<SS> = keyof {
	[K in keyof SS as SS[K] extends _Method ? K : never]: any;
};

/**
 * For internal use **only**.
 */
export type _ExtractActionsFromSetupStore<SS> = SS extends undefined | void
	? {}
	: Pick<SS, _ExtractActionsFromSetupStore_Keys<SS>>;

/**
 * For internal use **only**.
 */
export type _ExtractGettersFromSetupStore_Keys<SS> = keyof {
	[K in keyof SS as SS[K] extends ComputedRef ? K : never]: any;
};

/**
 * For internal use **only**.
 */
export type _ExtractGettersFromSetupStore<SS> = SS extends undefined | void
	? {}
	: Pick<SS, _ExtractGettersFromSetupStore_Keys<SS>>;

/**
 * For internal use **only**.
 */
export type _ExtractStateFromSetupStore_Keys<SS> = keyof {
	[K in keyof SS as SS[K] extends _Method | ComputedRef ? never : K]: any;
};

/**
 * For internal use **only**.
 */
export type _ExtractStateFromSetupStore<SS> = SS extends undefined | void
	? {}
	: Pick<SS, _ExtractStateFromSetupStore_Keys<SS>>;

/**
 * Creates a `useStore` function that retrieves the store instance.
 */
export function defineStore<
	Id extends string,
	S extends StateTree = {},
	G extends _GettersTree<S> = {},
	A = {},
>(id: Id, options: Omit<DefineStoreOptions<Id, S, G, A>, 'id'>): StoreDefinition<Id, S, G, A>;
export function defineStore<Id extends string, SS>(
	id: Id,
	storeSetup: (helpers: SetupStoreHelpers) => SS,
	options?: DefineSetupStoreOptions<
		Id,
		_ExtractStateFromSetupStore<SS>,
		_ExtractGettersFromSetupStore<SS>,
		_ExtractActionsFromSetupStore<SS>
	>,
): StoreDefinition<
	Id,
	_ExtractStateFromSetupStore<SS>,
	_ExtractGettersFromSetupStore<SS>,
	_ExtractActionsFromSetupStore<SS>
>;

/**
 * Creates an _accept_ function to pass to `import.meta.hot` in Vite applications.
 */
export function acceptHMRUpdate<
	Id extends string = string,
	S extends StateTree = StateTree,
	G extends _GettersTree<S> = _GettersTree<S>,
	A = _ActionsTree,
>(initialUseStore: StoreDefinition<Id, S, G, A>, hot: any): (newModule: any) => any;

// ---------- Plugins ----------

/**
 * Plugin to extend every store.
 */
export interface PiniaPlugin
{
	(context: PiniaPluginContext): Partial<PiniaCustomProperties & PiniaCustomStateProperties> | void;
}

/**
 * Context argument passed to Pinia plugins.
 */
export interface PiniaPluginContext<
	Id extends string = string,
	S extends StateTree = StateTree,
	G = _GettersTree<S>,
	A = _ActionsTree,
>
{
	pinia: Pinia;
	app: App;
	store: Store<Id, S, G, A>;
	options: DefineStoreOptionsInPlugin<Id, S, G, A>;
}

// ---------- Subscriptions ----------

/**
 * Possible types for SubscriptionCallback.
 */
export enum MutationType
{
	direct = 'direct',
	patchObject = 'patch object',
	patchFunction = 'patch function',
}

/**
 * Base type for the context passed to a subscription callback. Internal type.
 */
export interface _SubscriptionCallbackMutationBase
{
	type: MutationType;
	storeId: string;
	events?: DebuggerEvent[] | DebuggerEvent;
}

/**
 * Context passed to a subscription callback when directly mutating the state of
 * a store.
 */
export interface SubscriptionCallbackMutationDirect extends _SubscriptionCallbackMutationBase
{
	type: MutationType.direct;
	events: DebuggerEvent;
}

/**
 * Context passed to a subscription callback when `store.$patch()` is called
 * with a function.
 */
export interface SubscriptionCallbackMutationPatchFunction extends _SubscriptionCallbackMutationBase
{
	type: MutationType.patchFunction;
	events: DebuggerEvent[];
}

/**
 * Context passed to a subscription callback when `store.$patch()` is called
 * with an object.
 */
export interface SubscriptionCallbackMutationPatchObject<S> extends _SubscriptionCallbackMutationBase
{
	type: MutationType.patchObject;
	events: DebuggerEvent[];
	payload: _DeepPartial<UnwrapRef<S>>;
}

/**
 * Context object passed to a subscription callback.
 */
export type SubscriptionCallbackMutation<S> =
	| SubscriptionCallbackMutationDirect
	| SubscriptionCallbackMutationPatchObject<S>
	| SubscriptionCallbackMutationPatchFunction;

/**
 * Callback of a subscription.
 */
export type SubscriptionCallback<S> = (
	mutation: SubscriptionCallbackMutation<S>,
	state: UnwrapRef<S>,
) => void;

// ---------- $onAction ----------

/**
 * Argument of `store.$onAction()`.
 */
export type StoreOnActionListener<Id extends string, S extends StateTree, G, A> =
	(context: StoreOnActionListenerContext<Id, S, G, {} extends A ? _ActionsTree : A>) => void;

/**
 * Actual type for {@link StoreOnActionListenerContext}.
 * For internal use **only**.
 */
export interface _StoreOnActionListenerContext<Store, ActionName extends string, A>
{
	name: ActionName;
	store: Store;
	args: A extends Record<ActionName, _Method> ? Parameters<A[ActionName]> : unknown[];
	after: (
		callback: A extends Record<ActionName, _Method>
			? (resolvedReturn: Awaited<ReturnType<A[ActionName]>>) => void
			: () => void,
	) => void;
	onError: (callback: (error: unknown) => void) => void;
}

/**
 * Context object passed to callbacks of `store.$onAction(context => {})`.
 */
export type StoreOnActionListenerContext<Id extends string, S extends StateTree, G, A> =
	_ActionsTree extends A
		? _StoreOnActionListenerContext<StoreGeneric, string, _ActionsTree>
		: {
			[Name in keyof A]: Name extends string
				? _StoreOnActionListenerContext<Store<Id, S, G, A>, Name, A>
				: never;
		}[keyof A];

// ---------- map helpers ----------

/**
 * Interface to allow customizing map helpers.
 */
export interface MapStoresCustomization {}

/**
 * For internal use **only**.
 */
export type _MapActionsObjectReturn<A, T extends Record<string, keyof A>> = {
	[key in keyof T]: A[T[key]];
};

/**
 * For internal use **only**.
 */
export type _MapActionsReturn<A> = {
	[key in keyof A]: A[key];
};

export function mapActions<
	Id extends string,
	S extends StateTree,
	G extends _GettersTree<S>,
	A,
	KeyMapper extends Record<string, keyof A>,
>(useStore: StoreDefinition<Id, S, G, A>, keyMapper: KeyMapper): _MapActionsObjectReturn<A, KeyMapper>;
export function mapActions<
	Id extends string,
	S extends StateTree,
	G extends _GettersTree<S>,
	A,
>(useStore: StoreDefinition<Id, S, G, A>, keys: Array<keyof A>): _MapActionsReturn<A>;

/**
 * For internal use **only**.
 */
export type _MapStateObjectReturn<
	Id extends string,
	S extends StateTree,
	G extends _GettersTree<S> | { [key: string]: ComputedRef },
	A,
	T extends Record<string, keyof S | keyof G | ((store: Store<Id, S, G, A>) => any)> = {},
> = {
	[key in keyof T]: () => T[key] extends (store: any) => infer R
		? R
		: T[key] extends keyof Store<Id, S, G, A> ? Store<Id, S, G, A>[T[key]] : never;
};

/**
 * For internal use **only**.
 */
export type _MapStateReturn<
	S extends StateTree,
	G extends _GettersTree<S> | { [key: string]: ComputedRef },
	Keys extends keyof S | keyof G = keyof S | keyof G,
> = {
	[key in Keys]: key extends keyof Store<string, S, G, {}>
		? () => Store<string, S, G, {}>[key]
		: never;
};

export function mapState<
	Id extends string,
	S extends StateTree,
	G extends _GettersTree<S> | { [key: string]: ComputedRef },
	A,
	KeyMapper extends Record<string, keyof S | keyof G | ((store: Store<Id, S, G, A>) => any)>,
>(useStore: StoreDefinition<Id, S, G, A>, keyMapper: KeyMapper): _MapStateObjectReturn<Id, S, G, A, KeyMapper>;
export function mapState<
	Id extends string,
	S extends StateTree,
	G extends _GettersTree<S> | { [key: string]: ComputedRef },
	A,
	Keys extends keyof S | keyof G,
>(useStore: StoreDefinition<Id, S, G, A>, keys: readonly Keys[]): _MapStateReturn<S, G, Keys>;

/**
 * Alias for `mapState()`. You should use `mapState()` instead.
 * @deprecated use `mapState()` instead.
 */
export const mapGetters: typeof mapState;

/**
 * For internal use **only**.
 */
type _MapWritableStateKeys<S extends StateTree, G> = keyof UnwrapRef<S> | keyof _StoreWithGetters_Writable<G>;

/**
 * For internal use **only**.
 */
export type _MapWritableStateObjectReturn<
	S extends StateTree,
	G,
	KeyMapper extends Record<string, _MapWritableStateKeys<S, G>>,
> = {
	[key in keyof KeyMapper]: {
		get: () => UnwrapRef<(S & G)[KeyMapper[key]]>;
		set: (value: UnwrapRef<(S & G)[KeyMapper[key]]>) => any;
	};
};

/**
 * For internal use **only**.
 */
export type _MapWritableStateReturn<S extends StateTree, G, Keys extends _MapWritableStateKeys<S, G>> = {
	[key in Keys]: {
		get: () => UnwrapRef<(S & G)[key]>;
		set: (value: UnwrapRef<(S & G)[key]>) => any;
	};
};

export function mapWritableState<
	Id extends string,
	S extends StateTree,
	G,
	A,
	KeyMapper extends Record<string, _MapWritableStateKeys<S, G>>,
>(useStore: StoreDefinition<Id, S, G, A>, keyMapper: KeyMapper): _MapWritableStateObjectReturn<S, G, KeyMapper>;
export function mapWritableState<
	Id extends string,
	S extends StateTree,
	G,
	A,
	Keys extends _MapWritableStateKeys<S, G>,
>(useStore: StoreDefinition<Id, S, G, A>, keys: readonly Keys[]):
	Pick<_MapWritableStateReturn<S, G, Keys>, Keys>;

/**
 * For internal use **only**.
 */
export type _StoreObject<S> = S extends StoreDefinition<infer Ids, infer State, infer Getters, infer Actions>
	? {
		[Id in `${Ids}${MapStoresCustomization extends Record<'suffix', infer Suffix> ? Suffix : 'Store'}`]:
			() => Store<
				Id extends `${infer RealId}${MapStoresCustomization extends Record<'suffix', infer Suffix> ? Suffix : 'Store'}`
					? RealId
					: string,
				State,
				Getters,
				Actions
			>;
	}
	: {};

/**
 * For internal use **only**.
 */
export type _Spread<A extends readonly any[]> = A extends [infer L, ...infer R]
	? _StoreObject<L> & _Spread<R>
	: unknown;

export function mapStores<Stores extends any[]>(...stores: [...Stores]): _Spread<Stores>;

/**
 * Changes the suffix added by `mapStores()`. Can be set to an empty string.
 */
export function setMapStoreSuffix(
	suffix: MapStoresCustomization extends Record<'suffix', infer Suffix> ? Suffix : string,
): void;

// ---------- storeToRefs / hydration ----------

/**
 * Type that enables refactoring through IDE.
 * For internal use **only**.
 */
export type _UnwrapAll<SS> = {
	[K in keyof SS]: UnwrapRef<SS[K]>;
};

/**
 * Extracts the getters of a store while keeping writable and readonly properties.
 * Internal type, do not use.
 */
type _ToComputedRefs<SS> = {
	[K in keyof SS]: true extends _IsReadonly<SS, K> ? ComputedRef<SS[K]> : WritableComputedRef<SS[K]>;
};

/**
 * Extracts the refs of a state object from a store. Internal type, do not use.
 */
type _ToStateRefs<SS> = SS extends Store<string, infer UnwrappedState, _GettersTree<StateTree>, _ActionsTree>
	? UnwrappedState extends _UnwrapAll<Pick<infer State, infer Key>>
		? { [K in Key]: ToRef<State[K]> }
		: ToRefs<UnwrappedState>
	: ToRefs<StoreState<SS>>;

type StoreToRefs<SS extends StoreGeneric> = SS extends unknown
	? _ToStateRefs<SS>
		& ToRefs<PiniaCustomStateProperties<StoreState<SS>>>
		& _ToComputedRefs<StoreGetters<SS>>
	: never;

/**
 * Creates an object of references with all the state, getters, and plugin-added
 * state properties of the store.
 */
export function storeToRefs<SS extends StoreGeneric>(store: SS): StoreToRefs<SS>;

/**
 * Returns whether a value should be hydrated.
 */
export function shouldHydrate(obj: any): boolean;

/**
 * Tells Pinia to skip the hydration process of a given object.
 */
export function skipHydrate<T = any>(obj: T): T;

// ---------- Augment Vue instance type with $pinia ----------

declare module 'vue'
{
	interface ComponentCustomProperties
	{
		$pinia: Pinia;
		_pStores?: Record<string, StoreGeneric>;
	}
}

// ---------- Ambient namespace form (BX.Vue3.Pinia.*) ----------
//
// Mirrors the module form so `.d.ts` files of other Bitrix extensions can
// reference Pinia types as `BX.Vue3.Pinia.Store<...>` without having to
// `import('ui.vue3.pinia')` each time.

declare global
{
	namespace BX
	{
		namespace Vue3
		{
			namespace Pinia
			{
				type Pinia = import('ui.vue3.pinia').Pinia;
				type Store<
					Id extends string = string,
					S extends import('ui.vue3.pinia').StateTree = {},
					G = {},
					A = {},
				> = import('ui.vue3.pinia').Store<Id, S, G, A>;
				type StoreGeneric = import('ui.vue3.pinia').StoreGeneric;
				type StoreDefinition<
					Id extends string = string,
					S extends import('ui.vue3.pinia').StateTree = import('ui.vue3.pinia').StateTree,
					G = import('ui.vue3.pinia')._GettersTree<S>,
					A = import('ui.vue3.pinia')._ActionsTree,
				> = import('ui.vue3.pinia').StoreDefinition<Id, S, G, A>;
				type SetupStoreDefinition<Id extends string, SS> =
					import('ui.vue3.pinia').SetupStoreDefinition<Id, SS>;

				type StateTree = import('ui.vue3.pinia').StateTree;
				type StoreActions<SS> = import('ui.vue3.pinia').StoreActions<SS>;
				type StoreGetters<SS> = import('ui.vue3.pinia').StoreGetters<SS>;
				type StoreState<SS> = import('ui.vue3.pinia').StoreState<SS>;
				type StoreProperties<Id extends string> = import('ui.vue3.pinia').StoreProperties<Id>;

				type DefineStoreOptions<
					Id extends string,
					S extends import('ui.vue3.pinia').StateTree,
					G,
					A,
				> = import('ui.vue3.pinia').DefineStoreOptions<Id, S, G, A>;
				type DefineSetupStoreOptions<
					Id extends string,
					S extends import('ui.vue3.pinia').StateTree,
					G,
					A,
				> = import('ui.vue3.pinia').DefineSetupStoreOptions<Id, S, G, A>;
				type DefineStoreOptionsBase<S extends import('ui.vue3.pinia').StateTree, Store> =
					import('ui.vue3.pinia').DefineStoreOptionsBase<S, Store>;
				type DefineStoreOptionsInPlugin<
					Id extends string,
					S extends import('ui.vue3.pinia').StateTree,
					G,
					A,
				> = import('ui.vue3.pinia').DefineStoreOptionsInPlugin<Id, S, G, A>;

				type PiniaPlugin = import('ui.vue3.pinia').PiniaPlugin;
				type PiniaPluginContext<
					Id extends string = string,
					S extends import('ui.vue3.pinia').StateTree = import('ui.vue3.pinia').StateTree,
					G = import('ui.vue3.pinia')._GettersTree<S>,
					A = import('ui.vue3.pinia')._ActionsTree,
				> = import('ui.vue3.pinia').PiniaPluginContext<Id, S, G, A>;
				type PiniaCustomProperties<
					Id extends string = string,
					S extends import('ui.vue3.pinia').StateTree = import('ui.vue3.pinia').StateTree,
					G = import('ui.vue3.pinia')._GettersTree<S>,
					A = import('ui.vue3.pinia')._ActionsTree,
				> = import('ui.vue3.pinia').PiniaCustomProperties<Id, S, G, A>;
				type PiniaCustomStateProperties<S extends import('ui.vue3.pinia').StateTree = import('ui.vue3.pinia').StateTree> =
					import('ui.vue3.pinia').PiniaCustomStateProperties<S>;

				type MutationType = import('ui.vue3.pinia').MutationType;
				type SubscriptionCallback<S> = import('ui.vue3.pinia').SubscriptionCallback<S>;
				type SubscriptionCallbackMutation<S> = import('ui.vue3.pinia').SubscriptionCallbackMutation<S>;
				type SubscriptionCallbackMutationDirect = import('ui.vue3.pinia').SubscriptionCallbackMutationDirect;
				type SubscriptionCallbackMutationPatchObject<S> =
					import('ui.vue3.pinia').SubscriptionCallbackMutationPatchObject<S>;
				type SubscriptionCallbackMutationPatchFunction =
					import('ui.vue3.pinia').SubscriptionCallbackMutationPatchFunction;

				type StoreOnActionListener<
					Id extends string,
					S extends import('ui.vue3.pinia').StateTree,
					G,
					A,
				> = import('ui.vue3.pinia').StoreOnActionListener<Id, S, G, A>;
				type StoreOnActionListenerContext<
					Id extends string,
					S extends import('ui.vue3.pinia').StateTree,
					G,
					A,
				> = import('ui.vue3.pinia').StoreOnActionListenerContext<Id, S, G, A>;

				type MapStoresCustomization = import('ui.vue3.pinia').MapStoresCustomization;
			}
		}
	}
}
