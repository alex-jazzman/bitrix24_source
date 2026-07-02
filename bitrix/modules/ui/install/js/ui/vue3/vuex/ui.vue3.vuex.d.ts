/**
 * Public type surface of the `ui.vue3.vuex` Bitrix extension.
 *
 * This file is referenced from `bundle.config.js` via the `types` field, so
 * `webpack.config.js` resolves the extension's design-time alias here (PhpStorm
 * uses webpack aliases for module resolution in Flow-typed `.js` files). The
 * runtime `input` (`./src/vuex.js`) and the production bundle are unaffected —
 * `types` is read only by the IDE-facing alias generator.
 *
 * Structure:
 *  - the entire Vuex 4 public API is re-declared inline so consumers get the
 *    same generics as the upstream vuex@4.1.0 typings: `Store<S>`,
 *    `GetterTree<S, R>`, `ActionTree<S, R>`, `MutationTree<S>`,
 *    `Module<S, R>`, `Plugin<S>`, `Dispatch`, `Commit`, plus
 *    `mapState`/`mapGetters`/`mapMutations`/`mapActions`,
 *    `createNamespacedHelpers`, `createStore`, `createLogger`, `useStore`,
 *    `storeKey`. Types are inlined (not re-exported from the npm package)
 *    because vuex@4.1.0's `package.json` does not list its typings under
 *    `exports`, which makes them unreachable under `moduleResolution: bundler`.
 *  - Bitrix-specific API (`Builder`, `BuilderModel`, `BuilderEntityModel`,
 *    `BuilderDatabaseType`, `NestedModuleTree`) is declared on top.
 *  - Vue's `ComponentCustomProperties` is augmented with `$store` so that
 *    `this.$store.getters[...]` types automatically in any component.
 *  - `BX.Vue3.Vuex.*` ambient namespace is declared globally for `.d.ts`
 *    consumers that need to reference Vuex types without an explicit import.
 *
 * Source: vuex 4.1.0 (https://github.com/vuejs/vuex/tree/v4.1.0/types).
 * If vuex is bumped in `src/vuex.js`, mirror the public type changes here.
 */

import type { App, ComponentPublicInstance, InjectionKey, WatchOptions } from 'vue';

// ---------- Vuex 4 core API ----------

export class Store<S>
{
	constructor(options: StoreOptions<S>);

	readonly state: S;
	readonly getters: any;

	install(app: App, injectKey?: InjectionKey<Store<any>> | string): void;

	replaceState(state: S): void;

	dispatch: Dispatch;
	commit: Commit;

	subscribe<P extends MutationPayload>(
		fn: (mutation: P, state: S) => any,
		options?: SubscribeOptions,
	): () => void;
	subscribeAction<P extends ActionPayload>(
		fn: SubscribeActionOptions<P, S>,
		options?: SubscribeOptions,
	): () => void;
	watch<T>(
		getter: (state: S, getters: any) => T,
		cb: (value: T, oldValue: T) => void,
		options?: WatchOptions,
	): () => void;

	registerModule<T>(path: string, module: Module<T, S>, options?: ModuleOptions): void;
	registerModule<T>(path: string[], module: Module<T, S>, options?: ModuleOptions): void;

	unregisterModule(path: string): void;
	unregisterModule(path: string[]): void;

	hasModule(path: string): boolean;
	hasModule(path: string[]): boolean;

	hotUpdate(options: {
		actions?: ActionTree<S, S>;
		mutations?: MutationTree<S>;
		getters?: GetterTree<S, S>;
		modules?: ModuleTree<S>;
	}): void;
}

export const storeKey: string;

export function createStore<S>(options: StoreOptions<S>): Store<S>;

export function useStore<S = any>(injectKey?: InjectionKey<Store<S>> | string): Store<S>;

export interface Dispatch
{
	(type: string, payload?: any, options?: DispatchOptions): Promise<any>;
	<P extends Payload>(payloadWithType: P, options?: DispatchOptions): Promise<any>;
}

export interface Commit
{
	(type: string, payload?: any, options?: CommitOptions): void;
	<P extends Payload>(payloadWithType: P, options?: CommitOptions): void;
}

export interface ActionContext<S, R>
{
	dispatch: Dispatch;
	commit: Commit;
	state: S;
	getters: any;
	rootState: R;
	rootGetters: any;
}

export interface Payload
{
	type: string;
}

export interface MutationPayload extends Payload
{
	payload: any;
}

export interface ActionPayload extends Payload
{
	payload: any;
}

export interface SubscribeOptions
{
	prepend?: boolean;
}

export type ActionSubscriber<P, S> = (action: P, state: S) => any;
export type ActionErrorSubscriber<P, S> = (action: P, state: S, error: Error) => any;

export interface ActionSubscribersObject<P, S>
{
	before?: ActionSubscriber<P, S>;
	after?: ActionSubscriber<P, S>;
	error?: ActionErrorSubscriber<P, S>;
}

export type SubscribeActionOptions<P, S> =
	| ActionSubscriber<P, S>
	| ActionSubscribersObject<P, S>;

export interface DispatchOptions
{
	root?: boolean;
}

export interface CommitOptions
{
	silent?: boolean;
	root?: boolean;
}

export interface StoreOptions<S>
{
	state?: S | (() => S);
	getters?: GetterTree<S, S>;
	actions?: ActionTree<S, S>;
	mutations?: MutationTree<S>;
	modules?: ModuleTree<S>;
	plugins?: Plugin<S>[];
	strict?: boolean;
	devtools?: boolean;
}

export type ActionHandler<S, R> = (
	this: Store<R>,
	injectee: ActionContext<S, R>,
	payload?: any,
) => any;

export interface ActionObject<S, R>
{
	root?: boolean;
	handler: ActionHandler<S, R>;
}

export type Getter<S, R> = (state: S, getters: any, rootState: R, rootGetters: any) => any;
export type Action<S, R> = ActionHandler<S, R> | ActionObject<S, R>;
export type Mutation<S> = (state: S, payload?: any) => any;
export type Plugin<S> = (store: Store<S>) => any;

export interface Module<S, R>
{
	namespaced?: boolean;
	state?: S | (() => S);
	getters?: GetterTree<S, R>;
	actions?: ActionTree<S, R>;
	mutations?: MutationTree<S>;
	modules?: ModuleTree<R>;
}

export interface ModuleOptions
{
	preserveState?: boolean;
}

export interface GetterTree<S, R>
{
	[key: string]: Getter<S, R>;
}

export interface ActionTree<S, R>
{
	[key: string]: Action<S, R>;
}

export interface MutationTree<S>
{
	[key: string]: Mutation<S>;
}

export interface ModuleTree<R>
{
	[key: string]: Module<any, R>;
}

// ---------- Vuex 4 helpers (mapState / mapGetters / ...) ----------

type Computed = () => any;
type InlineComputed<T extends Function> =
	T extends (...args: any[]) => infer R ? () => R : never;
type MutationMethod = (...args: any[]) => void;
type ActionMethod = (...args: any[]) => Promise<any>;
type InlineMethod<T extends (fn: any, ...args: any[]) => any> =
	T extends (fn: any, ...args: infer Args) => infer R ? (...args: Args) => R : never;
type CustomVue = ComponentPublicInstance & Record<string, any>;

interface Mapper<R>
{
	<Key extends string>(map: Key[]): { [K in Key]: R };
	<Map extends Record<string, string>>(map: Map): { [K in keyof Map]: R };
}

interface MapperWithNamespace<R>
{
	<Key extends string>(namespace: string, map: Key[]): { [K in Key]: R };
	<Map extends Record<string, string>>(namespace: string, map: Map): { [K in keyof Map]: R };
}

interface MapperForState
{
	<S, Map extends Record<string, (this: CustomVue, state: S, getters: any) => any> = {}>(
		map: Map,
	): { [K in keyof Map]: InlineComputed<Map[K]> };
}

interface MapperForStateWithNamespace
{
	<S, Map extends Record<string, (this: CustomVue, state: S, getters: any) => any> = {}>(
		namespace: string,
		map: Map,
	): { [K in keyof Map]: InlineComputed<Map[K]> };
}

interface MapperForAction
{
	<Map extends Record<string, (this: CustomVue, dispatch: Dispatch, ...args: any[]) => any>>(
		map: Map,
	): { [K in keyof Map]: InlineMethod<Map[K]> };
}

interface MapperForActionWithNamespace
{
	<Map extends Record<string, (this: CustomVue, dispatch: Dispatch, ...args: any[]) => any>>(
		namespace: string,
		map: Map,
	): { [K in keyof Map]: InlineMethod<Map[K]> };
}

interface MapperForMutation
{
	<Map extends Record<string, (this: CustomVue, commit: Commit, ...args: any[]) => any>>(
		map: Map,
	): { [K in keyof Map]: InlineMethod<Map[K]> };
}

interface MapperForMutationWithNamespace
{
	<Map extends Record<string, (this: CustomVue, commit: Commit, ...args: any[]) => any>>(
		namespace: string,
		map: Map,
	): { [K in keyof Map]: InlineMethod<Map[K]> };
}

interface NamespacedMappers
{
	mapState: Mapper<Computed> & MapperForState;
	mapMutations: Mapper<MutationMethod> & MapperForMutation;
	mapGetters: Mapper<Computed>;
	mapActions: Mapper<ActionMethod> & MapperForAction;
}

export const mapState: Mapper<Computed>
	& MapperWithNamespace<Computed>
	& MapperForState
	& MapperForStateWithNamespace;

export const mapMutations: Mapper<MutationMethod>
	& MapperWithNamespace<MutationMethod>
	& MapperForMutation
	& MapperForMutationWithNamespace;

export const mapGetters: Mapper<Computed>
	& MapperWithNamespace<Computed>;

export const mapActions: Mapper<ActionMethod>
	& MapperWithNamespace<ActionMethod>
	& MapperForAction
	& MapperForActionWithNamespace;

export function createNamespacedHelpers(namespace: string): NamespacedMappers;

// ---------- Vuex 4 logger plugin ----------

interface LoggerConsole extends Partial<Pick<Console, 'groupCollapsed' | 'group' | 'groupEnd'>>
{
	log(message: string, color: string, payload: any): void;
	log(message: string): void;
}

export interface LoggerOption<S>
{
	collapsed?: boolean;
	filter?: <P extends Payload>(mutation: P, stateBefore: S, stateAfter: S) => boolean;
	transformer?: (state: S) => any;
	mutationTransformer?: <P extends Payload>(mutation: P) => any;
	actionFilter?: <P extends Payload>(action: P, state: S) => boolean;
	actionTransformer?: <P extends Payload>(action: P) => any;
	logMutations?: boolean;
	logActions?: boolean;
	logger?: LoggerConsole;
}

export function createLogger<S>(option?: LoggerOption<S>): Plugin<S>;

// ---------- Bitrix-specific API ----------

/**
 * Persistent storage backend used by `Builder` / `BuilderModel`.
 */
export const BuilderDatabaseType: {
	readonly indexedDb: 'indexedDb';
	readonly localStorage: 'localStorage';
	readonly jnSharedStorage: 'jnSharedStorage';
};

export type BuilderDatabaseTypeValue =
	typeof BuilderDatabaseType[keyof typeof BuilderDatabaseType];

export interface BuilderDatabaseConfig
{
	name?: string;
	type?: BuilderDatabaseTypeValue;
	storage?: string;
	siteId?: string;
	userId?: number;
	timeout?: number;
}

export interface BuilderBuildResult<S = any>
{
	store: Store<S>;
	models: Array<BuilderModel<any, S>>;
	builder: Builder<S>;
}

/**
 * Bitrix Vuex builder — the idiomatic way to assemble a store out of
 * `BuilderModel` instances with optional persistent storage.
 */
export class Builder<S = any>
{
	static create<S = any>(): Builder<S>;
	static init<S = any>(store?: Store<S>): Builder<S>;

	constructor(store?: Store<S>);

	addModel(model: BuilderModel<any, S>): this;
	addDynamicModel(model: BuilderModel<any, S>): Promise<void>;
	removeDynamicModel(namespace: string): this;
	setDatabaseConfig(config?: BuilderDatabaseConfig): this;
	clearModelState(callback?: ((result: boolean) => void) | null): Promise<boolean>;
	clearDatabase(): Promise<boolean>;
	build(callback?: ((result: BuilderBuildResult<S>) => void) | null): Promise<BuilderBuildResult<S>>;
	syncBuild(): BuilderBuildResult<S>;

	/** @deprecated Builder is always namespaced. */
	useNamespace(active: boolean): this;
}

/**
 * Tree of nested `BuilderModel`-classes (returned from `getNestedModules()`).
 *
 * Note: values are model *classes*, not instances. Vuex builder instantiates
 * them when assembling the module tree.
 */
export interface NestedModuleTree<R = any>
{
	[moduleName: string]: new () => BuilderModel<any, R>;
}

/**
 * Base class for Bitrix Vuex modules.
 *
 * Subclasses override `getName`, `getState`, `getGetters`, `getActions`,
 * `getMutations` (and optionally `getNestedModules`) to declare a single
 * namespaced module that `Builder` then registers in the store.
 */
export class BuilderModel<S = any, R = any>
{
	static create<S = any, R = any>(): BuilderModel<S, R>;

	constructor();

	getName(): string;
	getState(): S;
	getElementState(params?: object): object;
	getStateSaveException(): object | undefined;

	getGetters(): GetterTree<S, R>;
	getActions(): ActionTree<S, R>;
	getMutations(): MutationTree<S>;
	getNestedModules(): NestedModuleTree<R>;

	validate(fields: object, options?: object): object;

	setVariables(variables?: Record<string, any>): this;
	getVariable<T = any>(name: string, defaultValue?: T): T;

	getNamespace(): string;
	setNamespace(name: string): this;

	useDatabase(active: boolean, config?: BuilderDatabaseConfig): this;

	setStore(store: Store<R>): this;
	getModule(): Promise<{ namespace: string; module: object }>;
	getNestedModule(nestedModule: new () => BuilderModel<any, R>): object;
	getModuleWithDefaultState(): { namespace: string; module: object } | null;

	getSaveTimeout(): number;
	getLoadTimeout(): number | boolean;
	getLoadedState(state?: object): object;

	saveState(state?: S | (() => S)): boolean;
	clearState(): Promise<object> | boolean;
	clearDatabase(): boolean;

	isSaveAvailable(): boolean;
	isSaveNeeded(payload: object): boolean;

	cloneState(element: any, exceptions?: object): any;

	/** @deprecated use getModule instead. */
	getStore(): Promise<object>;

	/** @deprecated BuilderModel is always namespaced. */
	useNamespace(active: boolean): this;
}

/**
 * Convenience subclass that pre-implements an entity-collection module
 * (`collection: { [id]: Item }`) with default `getAll`/`getById`/...
 * getters and `insert`/`upsert`/`update`/`delete` mutations + actions.
 */
export class BuilderEntityModel<S = any, Item = any> extends BuilderModel<S, any>
{
	static defaultModel: {
		getState: () => object;
		getGetters: () => object;
		getActions: () => object;
		getMutations: (target: BuilderEntityModel<any, any>) => object;
	};
}

// ---------- Augment Vue instance type with $store ----------

declare module 'vue'
{
	interface ComponentCustomProperties
	{
		$store: Store<any>;
	}
}

// ---------- Ambient namespace form (BX.Vue3.Vuex.*) ----------
//
// Mirrors the module form so `.d.ts` files of other Bitrix extensions can
// reference Vuex types as `BX.Vue3.Vuex.Store<...>` without having to
// `import('ui.vue3.vuex')` each time.

declare global
{
	namespace BX
	{
		namespace Vue3
		{
			namespace Vuex
			{
				type Store<S> = import('ui.vue3.vuex').Store<S>;
				type StoreOptions<S> = import('ui.vue3.vuex').StoreOptions<S>;
				type Module<S, R> = import('ui.vue3.vuex').Module<S, R>;
				type ModuleTree<R> = import('ui.vue3.vuex').ModuleTree<R>;
				type ModuleOptions = import('ui.vue3.vuex').ModuleOptions;

				type Plugin<S> = import('ui.vue3.vuex').Plugin<S>;
				type Dispatch = import('ui.vue3.vuex').Dispatch;
				type Commit = import('ui.vue3.vuex').Commit;
				type ActionContext<S, R> = import('ui.vue3.vuex').ActionContext<S, R>;
				type Payload = import('ui.vue3.vuex').Payload;
				type MutationPayload = import('ui.vue3.vuex').MutationPayload;
				type ActionPayload = import('ui.vue3.vuex').ActionPayload;
				type DispatchOptions = import('ui.vue3.vuex').DispatchOptions;
				type CommitOptions = import('ui.vue3.vuex').CommitOptions;
				type SubscribeOptions = import('ui.vue3.vuex').SubscribeOptions;
				type SubscribeActionOptions<P, S> = import('ui.vue3.vuex').SubscribeActionOptions<P, S>;
				type ActionSubscriber<P, S> = import('ui.vue3.vuex').ActionSubscriber<P, S>;
				type ActionErrorSubscriber<P, S> = import('ui.vue3.vuex').ActionErrorSubscriber<P, S>;
				type ActionSubscribersObject<P, S> = import('ui.vue3.vuex').ActionSubscribersObject<P, S>;

				type Getter<S, R> = import('ui.vue3.vuex').Getter<S, R>;
				type Action<S, R> = import('ui.vue3.vuex').Action<S, R>;
				type Mutation<S> = import('ui.vue3.vuex').Mutation<S>;
				type ActionHandler<S, R> = import('ui.vue3.vuex').ActionHandler<S, R>;
				type ActionObject<S, R> = import('ui.vue3.vuex').ActionObject<S, R>;

				type GetterTree<S, R> = import('ui.vue3.vuex').GetterTree<S, R>;
				type ActionTree<S, R> = import('ui.vue3.vuex').ActionTree<S, R>;
				type MutationTree<S> = import('ui.vue3.vuex').MutationTree<S>;

				type LoggerOption<S> = import('ui.vue3.vuex').LoggerOption<S>;

				// Bitrix-specific (ambient-accessible through BX.Vue3.Vuex)
				type Builder<S = any> = import('ui.vue3.vuex').Builder<S>;
				type BuilderModel<S = any, R = any> = import('ui.vue3.vuex').BuilderModel<S, R>;
				type BuilderEntityModel<S = any, Item = any> =
					import('ui.vue3.vuex').BuilderEntityModel<S, Item>;
				type NestedModuleTree<R = any> = import('ui.vue3.vuex').NestedModuleTree<R>;
				type BuilderDatabaseConfig = import('ui.vue3.vuex').BuilderDatabaseConfig;
				type BuilderDatabaseTypeValue = import('ui.vue3.vuex').BuilderDatabaseTypeValue;
			}
		}
	}
}
