import { Dom, Tag, Type } from 'main.core';
import { BaseEvent, EventEmitter } from 'main.core.events';
import { BitrixVue, defineComponent, nextTick, reactive } from 'ui.vue3';
import type { App } from 'ui.vue3';
import { locMixin } from 'ui.vue3.mixins.loc-mixin';

import { MainToolPicker } from '../component/main-tool-picker/main-tool-picker';
import type { MainToolPickerOptions, MainToolSelection } from '../model/picker/types';

type MainToolPickerEventName = 'confirm' | 'ready' | 'closeRequested' | 'error';

export class MainToolPickerApplication
{
	#events: EventEmitter;
	#options: MainToolPickerOptions | null;
	#status: { busy: boolean } | null;
	#content: HTMLElement | null = null;
	#application: App | null = null;
	#destroyed: boolean = false;
	#failed: boolean = false;
	#ready: boolean = false;

	constructor(options: MainToolPickerOptions)
	{
		this.#options = options;
		this.#status = reactive({ busy: options.busy });
		this.#events = new EventEmitter();
		this.#events.setEventNamespace('BX.Intranet.MainToolPicker');
	}

	getContent(): HTMLElement
	{
		if (this.#destroyed || !this.#options || !this.#status)
		{
			throw new Error('Main tool picker has been destroyed.');
		}

		if (this.#content)
		{
			return this.#content;
		}

		const content = Tag.render`<div class="intranet-main-tool-picker-application"></div>`;
		this.#content = content;
		const { state, openingReason } = this.#options;
		const status = this.#status;

		try
		{
			this.#application = BitrixVue.createApp(defineComponent({
				name: 'IntranetMainToolPickerApplication',
				components: { MainToolPicker },
				data: () => ({ state, openingReason, status }),
				methods: {
					handleConfirm: this.#handleConfirm,
					handleReady: this.#handleReady,
					handleCloseRequested: this.#handleCloseRequested,
				},
				template: `
					<MainToolPicker
						:state="state"
						:openingReason="openingReason"
						:busy="status.busy"
						@confirm="handleConfirm"
						@ready="handleReady"
						@closeRequested="handleCloseRequested"
					/>
				`,
			}));
			this.#application.mixin(locMixin);
			this.#application.config.errorHandler = this.#handleError;
			this.#application.mount(content);
		}
		catch (error)
		{
			void this.#handleError(error);
		}

		return content;
	}

	setBusy(busy: boolean): void
	{
		if (!this.#destroyed && this.#status)
		{
			this.#status.busy = busy;
		}
	}

	subscribe(eventName: MainToolPickerEventName, handler: (event: BaseEvent<mixed>) => void): void
	{
		if (!this.#destroyed)
		{
			this.#events.subscribe(eventName, handler);
		}
	}

	unsubscribeAll(): void
	{
		this.#events.unsubscribeAll();
	}

	destroy(): void
	{
		if (this.#destroyed)
		{
			return;
		}

		this.#destroyed = true;
		this.unsubscribeAll();
		const application = this.#application;
		const content = this.#content;
		this.#application = null;
		this.#content = null;
		this.#options = null;
		this.#status = null;

		try
		{
			application?.unmount();
		}
		finally
		{
			if (content)
			{
				Dom.clean(content);
				Dom.remove(content);
			}
		}
	}

	#handleConfirm = (selection: MainToolSelection): void => {
		if (this.#destroyed || this.#failed || !this.#ready || this.#status?.busy)
		{
			return;
		}

		this.#events.emit('confirm', new BaseEvent({ data: selection }));
	};

	#handleReady = async (): Promise<void> => {
		await nextTick();
		if (this.#destroyed || this.#failed || this.#ready)
		{
			return;
		}

		this.#ready = true;
		this.#events.emit('ready', new BaseEvent());
	};

	#handleCloseRequested = (): void => {
		if (!this.#destroyed && !this.#failed)
		{
			this.#events.emit('closeRequested', new BaseEvent());
		}
	};

	#handleError = async (error?: mixed): Promise<void> => {
		if (this.#destroyed || this.#failed)
		{
			return;
		}

		this.#failed = true;
		await nextTick();
		if (!this.#destroyed)
		{
			const unavailable = Type.isObject(error) && 'code' in error && error.code === 'MAIN_TOOL_UNAVAILABLE';
			const data = unavailable ? { errors: [{ code: 'MAIN_TOOL_UNAVAILABLE' }] } : {};
			this.#events.emit('error', new BaseEvent({ data }));
		}
	};
}

export function createMainToolPicker(options: MainToolPickerOptions): MainToolPickerApplication
{
	return new MainToolPickerApplication(options);
}
