import { Event, Runtime, Type } from 'main.core';
import { type BaseEvent } from 'main.core.events';
import { type Slider, type SliderOptions } from 'main.sidepanel';

import { BitrixVue, type App as VueApp } from 'ui.vue3';
import { locMixin } from 'ui.vue3.mixins.loc-mixin';

import { Core } from 'socialnetwork.v2.core';
import { EventName } from 'socialnetwork.v2.const';
import { isCreateProjectWizardAction } from 'socialnetwork.v2.model.interface';

import { App } from './component/app';

let pendingStartupToolScroll = false;
let projectsTrialBannerProposed = false;

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
	#application: ?VueApp;
	#slider: ?Slider;
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
		BX.SidePanel.Instance.open(
			'socialnetwork-project-wizard-panel',
			{
				contentCallback: async (slider: Slider): Promise<HTMLElement> => {
					return this.mount(slider);
				},
				cacheable: false,
				events: {
					onClose: (): void => this.unmount(),
				},
				...options,
			},
		);
	}

	async mount(slider?: Slider): Promise<void>
	{
		if (pendingStartupToolScroll)
		{
			pendingStartupToolScroll = false;
			this.#params.scrollToStartupTool = true;
		}

		if (slider)
		{
			if (slider.isOpen())
			{
				return;
			}

			this.#slider = slider;

			this.#params.container = slider.getContentContainer();
		}

		if (!Type.isDomNode(this.#params.container))
		{
			throw new Error('The container for mounting the program is not set.');
		}

		this.#application = await this.#mountApplication(this.#params.container);
		this.#subscribe();
	}

	unmount(): void
	{
		this.#unmountApplication();
		this.#unsubscribe();
	}

	#subscribe(): void
	{
		this.#boundClose = this.#close.bind(this);
		this.#boundSave = this.#save.bind(this);
		Event.EventEmitter.subscribe(EventName.CloseProjectWizard, this.#boundClose);
		Event.EventEmitter.subscribe(EventName.SaveProjectWizard, this.#boundSave);
	}

	#unsubscribe(): void
	{
		if (Type.isFunction(this.#boundClose))
		{
			Event.EventEmitter.unsubscribe(EventName.CloseProjectWizard, this.#boundClose);
		}

		if (Type.isFunction(this.#boundSave))
		{
			Event.EventEmitter.unsubscribe(EventName.SaveProjectWizard, this.#boundSave);
		}

		this.#boundClose = null;
		this.#boundSave = null;
	}

	#close(): void
	{
		if (Type.isFunction(this.#params.onCancel))
		{
			this.#params.onCancel();
		}

		this.#slider?.close();

		this.unmount();
	}

	#save(event: BaseEvent): void
	{
		if (Type.isFunction(this.#params.onSave))
		{
			this.#params.onSave({
				id: event.data.id,
				name: event.data.name,
				chatId: event.data.chatId,
			});
		}

		this.#slider?.close();

		this.unmount();

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

	async #mountApplication(container: HTMLElement): VueApp
	{
		const application = BitrixVue.createApp(App);

		application.mixin(locMixin);
		// @chef-ignore
		application.use(Core.createStore());

		Core.initStores(this.#params);

		application.mount(container);

		return application;
	}

	#unmountApplication()
	{
		this.#application?.unmount();
		this.#application = null;
	}
}
