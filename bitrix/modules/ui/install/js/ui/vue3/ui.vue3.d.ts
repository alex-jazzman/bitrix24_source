/**
 * Public type surface of the `ui.vue3` Bitrix extension.
 *
 * This file is a regular ES module declaration (not `declare module '...'`).
 * It is pointed to via `paths['ui.vue3']` in aliases.tsconfig.json so that
 * any `import ... from 'ui.vue3'` in the project resolves here.
 *
 * Structure:
 *  - all Vue 3 public API is re-exported from 'vue' (node_modules/vue@3.5.28)
 *    so consumers get proper generics: defineComponent<...>, ref<T>, computed<T>,
 *    PropType<T>, Ref<T>, ComputedRef<T>, ComponentOptions<...>, DefineComponent<...>,
 *    WatchSource, InjectionKey<T> etc;
 *  - Bitrix-specific API is declared inline: BitrixVue, $Bitrix and its facets;
 *  - Vue's ComponentCustomProperties is augmented with $Bitrix/$bitrix so
 *    `this.$Bitrix.Loc.getMessage(...)` types automatically in any component;
 *  - legacy Bitrix-specific names are preserved as deprecated aliases;
 *  - `BX.Vue3.*` ambient namespace is declared globally for `.d.ts` consumers.
 */

import type {
	App,
	AppConfig,
	AsyncComponentOptions,
	Component,
	ComponentOptions,
	DebuggerEvent,
	Ref,
	SetupContext,
	WatchOptions,
} from 'vue';
import type { RestClient } from 'rest.client';
import type { PullClient } from 'pull.client';
import type { EventEmitter } from 'main.core.events';

// Re-export the entire Vue 3 public API.
export * from 'vue';

// ---------- Bitrix public API ($Bitrix, BitrixVue) ----------

export class $BitrixApplication
{
	get(): Object;
	set(instance: Object): void;
}

export class $BitrixData
{
	get(name: string, defaultValue?: any): any;
	set(name: string, value: any): void;
}

export class $BitrixRestClient
{
	get(): RestClient;
	set(instance: RestClient): void;
	isCustom(): boolean;
}

export class $BitrixPullClient
{
	get(): PullClient;
	set(instance: PullClient): void;
	isCustom(): boolean;
}

export class $BitrixLoc
{
	getMessage(name: string, defaultValue?: any): any;
	getMessages(): object;
	setMessage(id: string | { [key: string]: string }, value?: string): void;
}

export class BitrixInstance
{
	Application: $BitrixApplication;
	Data: $BitrixData;
	RestClient: $BitrixRestClient;
	PullClient: $BitrixPullClient;
	Loc: $BitrixLoc;
	eventEmitter: EventEmitter;
}

export namespace $Bitrix
{
	const Application: $BitrixApplication;
	const Data: $BitrixData;
	const RestClient: $BitrixRestClient;
	const PullClient: $BitrixPullClient;
	const Loc: $BitrixLoc;
	const eventEmitter: EventEmitter;
}

export interface EventsList
{
	restClientChange: string;
	pullClientChange: string;
}

export namespace BitrixVue
{
	function createApp(
		rootComponent: Component,
		rootProps?: Record<string, unknown> | null,
	): App;
	function mutableComponent(
		name: string,
		definition: ComponentOptions,
	): ComponentOptions;
	function cloneComponent(
		source: string | Component,
		mutations: ComponentOptions,
	): ComponentOptions;
	function mutateComponent(
		source: string | Component,
		mutations: ComponentOptions,
	): boolean;
	function defineAsyncComponent(
		extension: string | string[],
		componentExportName: string,
		options?: AsyncComponentOptions,
	): Component;
	function getMutableComponent(name: string, silentMode?: boolean): ComponentOptions | null;
	function isComponent(name: string): boolean;
	function testNode(object: object, params: object): boolean;
	function getFilteredPhrases(
		vueInstance: App,
		phrasePrefix: string | Array<string>,
		phrases: object | null,
	): ReadonlyArray<any>;
	const events: EventsList;
}

// ---------- Legacy Bitrix-specific aliases (backward compatibility) ----------

/** @deprecated Prefer `ComponentOptions` from Vue directly. */
export type BitrixVueComponentProps = ComponentOptions;

/** @deprecated Prefer `ComponentOptions` from Vue directly. */
export type BitrixVueComponentProxy = ComponentOptions;

/** @deprecated Prefer `App` from Vue. */
export type VueCreateAppResult = App;

/** @deprecated Prefer `AppConfig` from Vue. */
export type VueAppConfig = AppConfig;

/** @deprecated Prefer `AsyncComponentOptions` from Vue. */
export type VueAsyncComponentOptions = AsyncComponentOptions;

/** @deprecated Prefer `Ref<T>` from Vue. */
export type VueRefValue = Ref;

/** @deprecated Prefer `WatchOptions` from Vue. */
export type VueWatchEffectOptions = WatchOptions;

/** @deprecated Prefer `DebuggerEvent` from Vue. */
export type VueDebuggerEvent = DebuggerEvent;

/** @deprecated Prefer `SetupContext` from Vue. */
export type VueSetupContext = SetupContext;

// ---------- Augment Vue instance type with $Bitrix / $bitrix ----------

declare module 'vue'
{
	interface ComponentCustomProperties
	{
		$Bitrix: BitrixInstance;
		$bitrix: BitrixInstance;
	}
}

// ---------- Ambient namespace form (BX.Vue3.*) ----------
//
// Mirrors the module form so `.d.ts` files of other Bitrix extensions can
// reference Vue types as `BX.Vue3.DefineComponent<...>` without having to
// `import('ui.vue3')` each time. Each entry is a thin alias to the matching
// type from 'vue' / ui.vue3 module surface — no duplication of implementation.

declare global
{
	namespace BX
	{
		namespace Vue3
		{
			// Core component API
			type DefineComponent<
				PropsOrPropOptions = {},
				RawBindings = {},
				D = {},
				C extends import('vue').ComputedOptions = {},
				M extends import('vue').MethodOptions = {},
				Mixin extends import('vue').ComponentOptionsMixin = import('vue').ComponentOptionsMixin,
				Extends extends import('vue').ComponentOptionsMixin = import('vue').ComponentOptionsMixin,
				E extends import('vue').EmitsOptions = {},
				EE extends string = string,
				PP = import('vue').PublicProps,
				Props = Readonly<import('vue').ExtractPropTypes<PropsOrPropOptions>>,
				Defaults = import('vue').ExtractDefaultPropTypes<PropsOrPropOptions>,
				S extends import('vue').SlotsType = {},
				LC extends Record<string, import('vue').Component> = {},
				Directives extends Record<string, import('vue').Directive> = {},
				Exposed extends string = string,
				Provide extends import('vue').ComponentProvideOptions = import('vue').ComponentProvideOptions,
				MakeDefaultsOptional extends boolean = true,
				TypeRefs extends Record<string, unknown> = {},
				TypeEl extends Element = any,
			> = import('vue').DefineComponent<
				PropsOrPropOptions, RawBindings, D, C, M, Mixin, Extends, E, EE, PP, Props,
				Defaults, S, LC, Directives, Exposed, Provide, MakeDefaultsOptional, TypeRefs, TypeEl
			>;

			type Component = import('vue').Component;
			type ComponentOptions = import('vue').ComponentOptions;
			type ComponentOptionsMixin = import('vue').ComponentOptionsMixin;
			type ComponentPublicInstance = import('vue').ComponentPublicInstance;
			type ComponentProvideOptions = import('vue').ComponentProvideOptions;
			type ComponentCustomProperties = import('vue').ComponentCustomProperties;

			type ComputedOptions = import('vue').ComputedOptions;
			type ComputedRef<T = any> = import('vue').ComputedRef<T>;
			type WritableComputedOptions<T, S = T> = import('vue').WritableComputedOptions<T, S>;
			type MethodOptions = import('vue').MethodOptions;

			type ExtractPropTypes<P> = import('vue').ExtractPropTypes<P>;
			type ExtractDefaultPropTypes<P> = import('vue').ExtractDefaultPropTypes<P>;
			type PropType<T> = import('vue').PropType<T>;
			type PublicProps = import('vue').PublicProps;

			type EmitsOptions = import('vue').EmitsOptions;
			type SlotsType<T extends Record<string, any> = Record<string, any>> = import('vue').SlotsType<T>;
			type Directive<T = any, V = any> = import('vue').Directive<T, V>;

			type App<HostElement = any> = import('vue').App<HostElement>;
			type AppConfig = import('vue').AppConfig;
			type AsyncComponentOptions<T = any> = import('vue').AsyncComponentOptions<T>;
			type AsyncComponentLoader<T = any> = import('vue').AsyncComponentLoader<T>;
			type Plugin = import('vue').Plugin;

			type Ref<T = any> = import('vue').Ref<T>;
			type ShallowRef<T = any> = import('vue').ShallowRef<T>;
			type MaybeRef<T = any> = import('vue').MaybeRef<T>;
			type MaybeRefOrGetter<T = any> = import('vue').MaybeRefOrGetter<T>;
			type UnwrapRef<T> = import('vue').UnwrapRef<T>;
			type UnwrapNestedRefs<T> = import('vue').UnwrapNestedRefs<T>;

			type SetupContext<E = import('vue').EmitsOptions, S extends import('vue').SlotsType = {}> =
				import('vue').SetupContext<E, S>;
			type InjectionKey<T> = import('vue').InjectionKey<T>;

			type VNode<HostNode = any, HostElement = any, ExtraProps = { [key: string]: any }> =
				import('vue').VNode<HostNode, HostElement, ExtraProps>;
			type VNodeTypes = import('vue').VNodeTypes;
			type VNodeProps = import('vue').VNodeProps;

			type WatchOptions<Immediate = boolean> = import('vue').WatchOptions<Immediate>;
			type WatchSource<T = any> = import('vue').WatchSource<T>;
			type WatchStopHandle = import('vue').WatchStopHandle;
			type WatchCallback<V = any, OV = any> = import('vue').WatchCallback<V, OV>;
			type WatchEffect = import('vue').WatchEffect;

			type DebuggerEvent = import('vue').DebuggerEvent;
			type DebuggerOptions = import('vue').DebuggerOptions;

			type HTMLAttributes = import('vue').HTMLAttributes;
			type SVGAttributes = import('vue').SVGAttributes;

			// Bitrix-specific (ambient-accessible through BX.Vue3)
			type BitrixInstance = import('ui.vue3').BitrixInstance;
			type $Bitrix = import('ui.vue3').BitrixInstance;
		}
	}
}
