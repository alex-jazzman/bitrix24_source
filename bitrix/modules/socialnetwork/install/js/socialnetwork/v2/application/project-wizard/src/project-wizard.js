import { Event, Loc, Runtime, Type } from 'main.core';
import { type BaseEvent } from 'main.core.events';
import { type Slider, type SliderOptions } from 'main.sidepanel';

import { BitrixVue, type App as VueApp } from 'ui.vue3';
import { locMixin } from 'ui.vue3.mixins.loc-mixin';

import { Core } from 'socialnetwork.v2.core';
import { EventName } from 'socialnetwork.v2.const';
import { isCreateProjectWizardAction, TYPES_PROJECT_WIZARD_ACTION } from 'socialnetwork.v2.model.interface';

import { App } from './component/app';

let pendingStartupToolScroll = false;
let projectsTrialBannerProposed = false;
let activeMountContainer: ?HTMLElement = null;

export type ProjectWizardParams = {
	action?: string,
	projectId?: number | null,
	publication?: boolean,
	scrollToStartupTool?: boolean,
	container?: HTMLElement,
	onSave?: ({ id: number, name: string, chatId: number }) => void,
	onCancel: () => void,
}

export class ProjectWizard
{
	#params: ProjectWizardParams;
	#application: ?VueApp = null;
	#slider: ?Slider = null;
	#container: ?HTMLElement = null;
	#generation: number = 0;
	#mountingPromise: ?Promise<void> = null;
	#boundSave: ((e: BaseEvent) => void) | null = null;
	#boundClose: (() => void) | null = null;

	constructor(params: ProjectWizardParams)
	{
		this.#params = this.#sanitizeParams(params || {});
	}

	static requestStartupToolScroll(): void
	{
		pendingStartupToolScroll = true;
	}

	#sanitizeParams(params = {}): Object
	{
		return Object.fromEntries(
			Object.entries(params)
				.filter(([, value]) => !Type.isUndefined(value)),
		);
	}

	show(options: SliderOptions = {}): void
	{
		let generation = null;
		let slider = null;
		let container = null;

		BX.SidePanel.Instance.open(
			'socialnetwork-project-wizard-panel',
			{
				title: this.#getSliderTitle(),
				...options,
				cacheable: false,
				contentCallback: async (currentSlider: Slider): Promise<void> => {
					const mountingPromise = this.mount(currentSlider);

					if (this.#slider === currentSlider)
					{
						generation = this.#generation;
						slider = this.#slider;
						container = this.#container;
					}

					return mountingPromise;
				},
				events: {
					...options.events,
					onClose: (event: BaseEvent): void => {
						this.#unmount(generation, slider, container);

						if (Type.isFunction(options.events?.onClose))
						{
							options.events.onClose(event);
						}
					},
				},
			},
		);
	}

	#getSliderTitle(): string
	{
		if (isCreateProjectWizardAction(this.#params.action))
		{
			return Loc.getMessage('SONET_EXT_PROJECT_WIZARD_SLIDER_TITLE_CREATE');
		}

		if (this.#params.action === TYPES_PROJECT_WIZARD_ACTION.COPY)
		{
			return Loc.getMessage('SONET_EXT_PROJECT_WIZARD_SLIDER_TITLE_COPY');
		}

		return Loc.getMessage('SONET_EXT_PROJECT_WIZARD_SLIDER_TITLE_UPDATE');
	}

	async mount(slider?: Slider): Promise<void>
	{
		const currentSlider = slider ?? null;
		const container = slider ? slider.getContentContainer() : this.#params.container;

		if (!Type.isDomNode(container))
		{
			throw new Error('The container for mounting the program is not set.');
		}

		if (this.#owns(this.#generation, currentSlider, container))
		{
			// Slider.reload() cleans the cached content container, so the mounted application is
			// already gone from the DOM while the ownership key still matches.
			if (this.#application && container.firstChild !== null)
			{
				return Promise.resolve();
			}

			if (this.#mountingPromise)
			{
				return this.#mountingPromise;
			}
		}

		// The request must survive the early returns above: it is consumed by the mount that
		// actually creates the application and reads the params.
		if (pendingStartupToolScroll)
		{
			pendingStartupToolScroll = false;
			this.#params.scrollToStartupTool = true;
		}

		this.unmount();

		const generation = ++this.#generation;
		this.#slider = currentSlider;
		this.#container = container;

		const mountingPromise = Promise.resolve().then(async (): Promise<void> => {
			if (!this.#owns(generation, currentSlider, container))
			{
				return;
			}

			try
			{
				const currentUser = await this.#loadCurrentUser();
				if (!this.#owns(generation, currentSlider, container))
				{
					return;
				}

				const application = this.#mountApplication(container, currentUser);
				if (!this.#owns(generation, currentSlider, container))
				{
					application.unmount();

					return;
				}

				this.#application = application;
				this.#subscribe(generation, currentSlider, container);
			}
			catch (error)
			{
				this.#unmount(generation, currentSlider, container);

				throw error;
			}
			finally
			{
				if (
					this.#generation === generation
					&& this.#mountingPromise === mountingPromise
				)
				{
					this.#mountingPromise = null;
				}
			}
		});

		this.#mountingPromise = mountingPromise;

		return mountingPromise;
	}

	unmount(): void
	{
		this.#unmount(this.#generation, this.#slider, this.#container);
	}

	#owns(generation: number, slider: ?Slider, container: ?HTMLElement): boolean
	{
		return (
			this.#generation === generation
			&& this.#slider === slider
			&& this.#container === container
		);
	}

	// Save and Close events are global and carry no mount identity, so only the latest live
	// mount in the window may react to them.
	#isEventTarget(generation: number, slider: ?Slider, container: HTMLElement): boolean
	{
		return activeMountContainer === container && this.#owns(generation, slider, container);
	}

	#subscribe(generation: number, slider: ?Slider, container: HTMLElement): void
	{
		activeMountContainer = container;

		this.#boundClose = (): void => this.#close(generation, slider, container);
		this.#boundSave = (event: BaseEvent): void => this.#save(event, generation, slider, container);

		Event.EventEmitter.subscribe(EventName.CloseProjectWizard, this.#boundClose);
		Event.EventEmitter.subscribe(EventName.SaveProjectWizard, this.#boundSave);
	}

	#unsubscribe(): void
	{
		if (this.#boundClose !== null)
		{
			Event.EventEmitter.unsubscribe(EventName.CloseProjectWizard, this.#boundClose);
			this.#boundClose = null;
		}

		if (this.#boundSave !== null)
		{
			Event.EventEmitter.unsubscribe(EventName.SaveProjectWizard, this.#boundSave);
			this.#boundSave = null;
		}
	}

	#close(generation: number, slider: ?Slider, container: HTMLElement): void
	{
		if (!this.#isEventTarget(generation, slider, container))
		{
			return;
		}

		if (Type.isFunction(this.#params.onCancel))
		{
			this.#params.onCancel();
		}

		slider?.close();

		this.#unmount(generation, slider, container);
	}

	#save(event: BaseEvent, generation: number, slider: ?Slider, container: HTMLElement): void
	{
		if (!this.#isEventTarget(generation, slider, container))
		{
			return;
		}

		if (Type.isFunction(this.#params.onSave))
		{
			this.#params.onSave({
				id: event.data.id,
				name: event.data.name,
				chatId: event.data.chatId,
			});
		}

		slider?.close();

		this.#unmount(generation, slider, container);

		this.#proposeProjectsTrial();
	}

	#proposeProjectsTrial(): void
	{
		if (
			!isCreateProjectWizardAction(this.#params.action)
			|| Core.getSettings().canProposeProjectsTrial !== true
			|| projectsTrialBannerProposed
		)
		{
			return;
		}

		projectsTrialBannerProposed = true;

		Runtime.loadExtension('socialnetwork.v2.components.popup.projects-trial-banner')
			.then(({ showProjectsTrialBanner }) => showProjectsTrialBanner())
			.catch(() => {
				projectsTrialBannerProposed = false;
			});
	}

	#mountApplication(container: HTMLElement, currentUser: ?Object): VueApp
	{
		const application = BitrixVue.createApp(App);

		application.mixin(locMixin);
		// @chef-ignore
		application.use(Core.createStore());

		Core.initStores({
			...this.#params,
			currentUser,
		});

		try
		{
			application.mount(container);
		}
		catch (error)
		{
			application.unmount();

			throw error;
		}

		return application;
	}

	async #loadCurrentUser(): Promise<?Object>
	{
		if (!isCreateProjectWizardAction(this.#params.action))
		{
			return null;
		}

		const { getCurrentUserSettings } = await Runtime.loadExtension('socialnetwork.v2.current-user');

		return getCurrentUserSettings();
	}

	#unmount(generation: ?number, slider: ?Slider, container: ?HTMLElement): void
	{
		if (generation === null || !this.#owns(generation, slider, container))
		{
			return;
		}

		const application = this.#application;

		this.#generation++;
		this.#application = null;
		this.#mountingPromise = null;
		this.#slider = null;
		this.#container = null;

		if (activeMountContainer === container)
		{
			activeMountContainer = null;
		}

		this.#unsubscribe();
		application?.unmount();
	}
}
