import { Dom, Event } from 'main.core';

import { type CleanupAction, type Screen } from '../../../application/screen';

export type PlatformIntegrationKind =
	| 'pageSwapper'
	| 'secretary'
	| 'form'
	| 'labels'
	| 'discuss'
	| 'popup'
	| 'loader'
	| 'subscription'
	| 'timer'
	| 'event'
	| 'custom'
;

export type DestroyableIntegration = {
	destroy(): void,
};

export type HideableIntegration = {
	hide(): void,
};

export type PageSwapperIntegration = {
	getWrapper?(): HTMLElement,
	hideLoader?(): void,
	loader?: HideableIntegration & Partial<DestroyableIntegration>,
};

export type PopupIntegration = HideableIntegration & Partial<DestroyableIntegration>;
export type LoaderIntegration = HideableIntegration & Partial<DestroyableIntegration>;
export type SecretaryIntegration = Partial<DestroyableIntegration>;
export type FormIntegration = Partial<DestroyableIntegration>;
export type LabelIntegration = Partial<DestroyableIntegration>;
export type DiscussIntegration = Partial<DestroyableIntegration>;

export type EventEmitterIntegration<EventPayload = unknown> = {
	subscribe(eventName: string, handler: (event: EventPayload) => void): void,
	unsubscribe(eventName: string, handler: (event: EventPayload) => void): void,
};

export type CustomEventBusIntegration<EventArguments extends unknown[]> = {
	addCustomEvent(eventName: string, handler: (...args: EventArguments) => void): void,
	removeCustomEvent(eventName: string, handler: (...args: EventArguments) => void): void,
};

export type SliderLifecycleEvent = {
	getSlider(): object | null,
};

export type SliderEventEmitterIntegration = {
	subscribe(
		target: object,
		eventName: string,
		handler: (event: SliderLifecycleEvent) => void,
		options?: { compatMode?: boolean },
	): void,
	unsubscribe(
		target: object,
		eventName: string,
		handler: (event: SliderLifecycleEvent) => void,
	): void,
};

type CacheableSlider = {
	setCacheable?(cacheable: boolean): void,
};

export type PlatformIntegrationEntry<Resource> = {
	kind: PlatformIntegrationKind,
	resource: Resource,
	cleanup: CleanupAction,
};

function createOnceCleanup(cleanup: CleanupAction): CleanupAction
{
	let active = true;

	return () => {
		if (!active)
		{
			return;
		}

		active = false;
		cleanup();
	};
}

export class PlatformIntegrationRegistry
{
	#screen: Screen;
	#sliderEventEmitter: SliderEventEmitterIntegration | null;
	#entries: PlatformIntegrationEntry<unknown>[] = [];
	#destroyed = false;

	constructor(screen: Screen, sliderEventEmitter?: SliderEventEmitterIntegration)
	{
		this.#screen = screen;
		this.#sliderEventEmitter = sliderEventEmitter ?? null;
		this.#screen.registerCleanup(() => this.destroy());
	}

	registerPageSwapper(
		pageSwapper: PageSwapperIntegration,
		cleanup?: (pageSwapper: PageSwapperIntegration) => void,
	): CleanupAction
	{
		this.#screen.setPageSwapper(pageSwapper);

		return this.#register('pageSwapper', pageSwapper, () => {
			cleanup?.(pageSwapper);
			this.#cleanupPageSwapper(pageSwapper);
			if (this.#screen.pageSwapper === pageSwapper)
			{
				this.#screen.setPageSwapper(null);
			}
		});
	}

	registerSlider(slider: object, cleanup?: (slider: object) => void): CleanupAction
	{
		this.#screen.setSlider(slider);
		const isCurrentSliderEvent = (event: SliderLifecycleEvent): boolean => {
			return event.getSlider() === slider && this.#screen.slider === slider;
		};

		const handleSliderCloseStart = (event: SliderLifecycleEvent): void => {
			if (isCurrentSliderEvent(event))
			{
				(slider as CacheableSlider).setCacheable?.(false);
				this.#screen.destroy();
			}
		};

		const handleSliderDestroy = (event: SliderLifecycleEvent): void => {
			if (isCurrentSliderEvent(event))
			{
				this.#screen.destroy();
			}
		};
		this.#sliderEventEmitter?.subscribe(
			slider,
			'SidePanel.Slider:onCloseStart',
			handleSliderCloseStart,
			{ compatMode: true },
		);
		this.#sliderEventEmitter?.subscribe(
			slider,
			'SidePanel.Slider:onDestroy',
			handleSliderDestroy,
			{ compatMode: true },
		);

		return this.#register('custom', slider, () => {
			this.#sliderEventEmitter?.unsubscribe(
				slider,
				'SidePanel.Slider:onCloseStart',
				handleSliderCloseStart,
			);
			this.#sliderEventEmitter?.unsubscribe(
				slider,
				'SidePanel.Slider:onDestroy',
				handleSliderDestroy,
			);
			cleanup?.(slider);
			if (this.#screen.slider === slider)
			{
				this.#screen.setSlider(null);
			}
		});
	}

	registerSecretary(secretary: SecretaryIntegration): CleanupAction
	{
		return this.#registerDestroyable('secretary', secretary);
	}

	registerForm(form: FormIntegration): CleanupAction
	{
		return this.#registerDestroyable('form', form);
	}

	registerLabels(labels: LabelIntegration): CleanupAction
	{
		return this.#registerDestroyable('labels', labels);
	}

	registerDiscuss(discuss: DiscussIntegration): CleanupAction
	{
		return this.#registerDestroyable('discuss', discuss);
	}

	registerPopup(popup: PopupIntegration): CleanupAction
	{
		return this.#register('popup', popup, () => {
			popup.hide();
			popup.destroy?.();
		});
	}

	registerLoader(loader: LoaderIntegration): CleanupAction
	{
		return this.#register('loader', loader, () => {
			loader.hide();
			loader.destroy?.();
		});
	}

	registerSubscription<EventPayload>(
		emitter: EventEmitterIntegration<EventPayload>,
		eventName: string,
		handler: (event: EventPayload) => void,
	): CleanupAction
	{
		emitter.subscribe(eventName, handler);

		return this.#register('subscription', emitter, () => {
			emitter.unsubscribe(eventName, handler);
		});
	}

	registerNativeEvent(
		target: EventTarget,
		eventName: string,
		listener: EventListener,
	): CleanupAction
	{
		return this.#registerBoundEvent(target, eventName, listener);
	}

	registerBitrixEvent(
		target: EventTarget,
		eventName: string,
		listener: EventListener,
	): CleanupAction
	{
		return this.registerNativeEvent(target, eventName, listener);
	}

	#registerBoundEvent(
		target: EventTarget,
		eventName: string,
		listener: EventListener,
	): CleanupAction
	{
		Event.bind(target, eventName, listener);

		return this.#register('event', target, () => {
			Event.unbind(target, eventName, listener);
		});
	}

	registerCustomEvent<EventArguments extends unknown[]>(
		eventBus: CustomEventBusIntegration<EventArguments>,
		eventName: string,
		handler: (...args: EventArguments) => void,
	): CleanupAction
	{
		eventBus.addCustomEvent(eventName, handler);

		return this.#register('custom', eventBus, () => {
			eventBus.removeCustomEvent(eventName, handler);
		});
	}

	setGuardedTimeout(callback: () => void, delay: number): number
	{
		const capturedGeneration = this.#screen.captureGeneration();
		const timerId = window.setTimeout(() => {
			this.#removeEntryByResource(timerId);
			this.#screen.guardCompletion(capturedGeneration, callback);
		}, delay);

		this.#register('timer', timerId, () => window.clearTimeout(timerId));

		return timerId;
	}

	setGuardedInterval(callback: () => void, delay: number): number
	{
		const capturedGeneration = this.#screen.captureGeneration();
		const timerId = window.setInterval(() => {
			this.#screen.guardCompletion(capturedGeneration, callback);
		}, delay);

		this.#register('timer', timerId, () => window.clearInterval(timerId));

		return timerId;
	}

	registerTimer(
		timerId: number,
		clearTimer: (timerId: number) => void,
	): CleanupAction
	{
		return this.#register('timer', timerId, () => clearTimer(timerId));
	}

	destroy(): void
	{
		if (this.#destroyed)
		{
			return;
		}

		this.#destroyed = true;
		const entries = this.#entries.splice(0).reverse();
		let cleanupError: unknown = null;
		entries.forEach((entry) => {
			try
			{
				entry.cleanup();
			}
			catch (error)
			{
				cleanupError ??= error;
			}
		});

		if (cleanupError)
		{
			throw cleanupError;
		}
	}

	#registerDestroyable<Resource extends Partial<DestroyableIntegration>>(
		kind: PlatformIntegrationKind,
		resource: Resource,
	): CleanupAction
	{
		return this.#register(kind, resource, () => {
			resource.destroy?.();
		});
	}

	#register<Resource>(
		kind: PlatformIntegrationKind,
		resource: Resource,
		cleanup: CleanupAction,
	): CleanupAction
	{
		const cleanupOnce = createOnceCleanup(cleanup);
		const entry: PlatformIntegrationEntry<Resource> = {
			kind,
			resource,
			cleanup: cleanupOnce,
		};

		if (this.#destroyed)
		{
			cleanupOnce();

			return () => {};
		}

		this.#entries.push(entry as PlatformIntegrationEntry<unknown>);

		return () => {
			const index = this.#entries.indexOf(entry as PlatformIntegrationEntry<unknown>);
			if (index >= 0)
			{
				this.#entries.splice(index, 1);
			}

			cleanupOnce();
		};
	}

	#removeEntryByResource(resource: unknown): void
	{
		const index = this.#entries.findIndex((entry) => entry.resource === resource);
		if (index >= 0)
		{
			this.#entries.splice(index, 1);
		}
	}

	#cleanupPageSwapper(pageSwapper: PageSwapperIntegration): void
	{
		pageSwapper.hideLoader?.();
		pageSwapper.loader?.hide();
		pageSwapper.loader?.destroy?.();

		const wrapper = pageSwapper.getWrapper?.();
		if (wrapper)
		{
			Dom.remove(wrapper);
		}
	}
}
