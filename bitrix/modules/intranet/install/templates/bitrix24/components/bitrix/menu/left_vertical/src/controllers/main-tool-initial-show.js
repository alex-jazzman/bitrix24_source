import { Event, Runtime, Type } from 'main.core';
import { EventEmitter } from 'main.core.events';
import type { BaseEvent } from 'main.core.events';
import type { Popup } from 'main.popup';
import PresetDefaultController from './preset-default-controller';
import Backend from '../backend';
import Options from '../options';

type InitialShowState = {
	autoEligible: boolean,
	canChangePersonal: boolean,
	availablePresets: Array<mixed>,
};

type InitialShowAttempt = {
	bootstrapRevision: number,
	popup: Popup | null,
};

const attemptedDocuments: WeakSet<Document> = new WeakSet();

export class MainToolInitialShow
{
	#controller: PresetDefaultController;
	#document: Document;
	#attempt: InitialShowAttempt | null = null;
	#destroyed: boolean = false;
	#frame: number | null = null;
	#finishFrame: ((completed: boolean) => void) | null = null;

	constructor(controller: PresetDefaultController, ownerDocument: Document)
	{
		this.#controller = controller;
		this.#document = ownerDocument;
		EventEmitter.subscribe(Options.eventName('onMainToolPickerBootstrap'), this.#onBootstrap);
		EventEmitter.subscribe(controller, Options.eventName('onMainToolPickerShown'), this.#onShown);
		EventEmitter.subscribe(controller, Options.eventName('onMainToolPickerClosed'), this.#onClosed);
		Event.bind(ownerDocument, 'visibilitychange', this.#onVisibilityChange);
		if (ownerDocument.defaultView)
		{
			Event.bind(ownerDocument.defaultView, 'pagehide', this.#onPageHide);
		}
	}

	async start(): Promise<void>
	{
		if (
			this.#destroyed
			|| attemptedDocuments.has(this.#document)
			|| !this.#isMenuAvailable()
			|| this.#controller.getPopup()
		)
		{
			return;
		}

		attemptedDocuments.add(this.#document);
		const attempt: InitialShowAttempt = {
			bootstrapRevision: Options.mainToolPickerBootstrapRevision,
			popup: null,
		};
		this.#attempt = attempt;

		try
		{
			const { data: state } = await Backend.getMainToolState();
			if (!this.#isCurrent(attempt) || !this.#isEligible(state))
			{
				return;
			}

			const stateSnapshot = JSON.stringify(state);
			const preparation = this.#controller.prepareMainToolPicker(state);
			attempt.popup = this.#controller.getPopup();
			const popup = await preparation;
			if (!popup || popup !== attempt.popup || !this.#isCurrent(attempt))
			{
				return;
			}

			const [{ data: currentState }, { nextTick }] = await Promise.all([
				Backend.getMainToolState(),
				Runtime.loadExtension('ui.vue3'),
			]);
			if (!this.#isCurrent(attempt))
			{
				return;
			}

			if (!this.#isEligible(currentState) || JSON.stringify(currentState) !== stateSnapshot)
			{
				this.#cancel('stale');

				return;
			}

			if (!this.#controller.showPreparedMainToolPicker(popup))
			{
				this.#cancel('hidden');

				return;
			}

			await nextTick();
			for (let frame = 0; frame < 2; frame++)
			{
				if (!this.#isCurrent(attempt) || !popup.isShown() || !await this.#nextFrame())
				{
					return;
				}
			}

			if (!this.#isCurrent(attempt) || !popup.isShown())
			{
				return;
			}

			const response = await Backend.confirmInitialShow();
			if (!this.#isCurrent(attempt))
			{
				return;
			}

			if (response?.data?.shown !== true)
			{
				throw new Error('Missing initial show confirmation.');
			}

			this.#attempt = null;
		}
		catch (response)
		{
			if (this.#isCurrent(attempt))
			{
				this.#cancel('error');
				PresetDefaultController.notifyMainToolError(response);
			}
		}
		finally
		{
			this.destroy();
		}
	}

	destroy(): void
	{
		if (this.#destroyed)
		{
			return;
		}

		this.#destroyed = true;
		this.#cancel('destroy');
		EventEmitter.unsubscribe(Options.eventName('onMainToolPickerBootstrap'), this.#onBootstrap);
		EventEmitter.unsubscribe(this.#controller, Options.eventName('onMainToolPickerShown'), this.#onShown);
		EventEmitter.unsubscribe(this.#controller, Options.eventName('onMainToolPickerClosed'), this.#onClosed);
		Event.unbind(this.#document, 'visibilitychange', this.#onVisibilityChange);
		if (this.#document.defaultView)
		{
			Event.unbind(this.#document.defaultView, 'pagehide', this.#onPageHide);
		}
	}

	#isMenuAvailable(): boolean
	{
		return Options.isMainToolPickerEnabled
			&& this.#document.visibilityState === 'visible'
			&& this.#document.defaultView !== null
			&& this.#controller.getContainer() === this.#document.getElementById('menu-items-block')
		;
	}

	#isCurrent(attempt: InitialShowAttempt): boolean
	{
		return !this.#destroyed
			&& this.#attempt === attempt
			&& this.#isMenuAvailable()
			&& attempt.bootstrapRevision === Options.mainToolPickerBootstrapRevision
			&& (attempt.popup
				? this.#controller.isMainToolPickerActive(attempt.popup)
				: this.#controller.getPopup() === null)
		;
	}

	#isEligible(state: InitialShowState): boolean
	{
		if (
			!Type.isPlainObject(state)
			|| !Type.isBoolean(state.autoEligible)
			|| !Type.isBoolean(state.canChangePersonal)
			|| !Type.isArray(state.availablePresets)
		)
		{
			throw new Error('Invalid initial show state.');
		}

		return state.autoEligible && state.canChangePersonal && state.availablePresets.length > 0;
	}

	#nextFrame(): Promise<boolean>
	{
		const view = this.#document.defaultView;
		if (!view)
		{
			return Promise.resolve(false);
		}

		return new Promise((resolve) => {
			this.#finishFrame = resolve;
			this.#frame = view.requestAnimationFrame(() => {
				this.#frame = null;
				this.#finishFrame = null;
				resolve(true);
			});
		});
	}

	#cancel(reason: string): void
	{
		const attempt = this.#attempt;
		this.#attempt = null;
		if (this.#frame !== null)
		{
			this.#document.defaultView?.cancelAnimationFrame(this.#frame);
			this.#frame = null;
		}

		this.#finishFrame?.(false);
		this.#finishFrame = null;
		if (attempt?.popup)
		{
			this.#controller.closeMainToolPicker(attempt.popup, reason);
		}
	}

	#onBootstrap = (): void => {
		this.#cancel('bootstrap');
		this.destroy();
	};

	#onVisibilityChange = (): void => {
		if (this.#document.visibilityState !== 'visible')
		{
			this.#cancel('hidden');
			this.destroy();
		}
	};

	#onPageHide = (): void => {
		this.#cancel('pagehide');
		this.destroy();
	};

	#onShown = (event: BaseEvent): void => {
		if (event.getData().openingReason === 'manual')
		{
			this.destroy();
		}
	};

	#onClosed = (event: BaseEvent): void => {
		const { popup, openingReason } = event.getData();
		if (popup === this.#attempt?.popup)
		{
			this.#attempt = null;
			this.destroy();
		}
		else if (openingReason === 'manual')
		{
			this.destroy();
		}
	};
}
