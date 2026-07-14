import { Loc } from 'main.core';
import { BitrixVue } from 'ui.vue3';

import { App } from './components/app';
import { createFormState, formStateKey } from './state';
import type { ConnectionRequestPayload, FormState, InitialData, MailboxConfigFormOptions } from './types';

type SliderRequestParams = {
	connectionRequest?: {
		requestId?: number | string;
		requesterId?: number | string;
	};
};

type SidePanelSlider = {
	getRequestParams?(): SliderRequestParams | null;
};

type RootBXSidePanel = {
	SidePanel?: {
		Instance?: {
			getTopSlider?(): SidePanelSlider | null;
		};
	};
};

function readConnectionRequestFromSlider(): ConnectionRequestPayload | null
{
	const topWindow = (window.top ?? window) as Window & { BX?: RootBXSidePanel };
	const slider = topWindow.BX?.SidePanel?.Instance?.getTopSlider?.();
	const params = slider?.getRequestParams?.();
	const cr = params?.connectionRequest;

	if (!cr)
	{
		return null;
	}

	const requestId = Number(cr.requestId);
	const requesterId = Number(cr.requesterId);

	if (!requestId || !requesterId)
	{
		return null;
	}

	return { requestId, requesterId };
}

type VueApplication = {
	config: {
		globalProperties: {
			loc?: (phraseCode: string, replacements?: Record<string, string>) => string;
		};
	};
	provide(key: symbol, value: unknown): void;
	mount(rootContainer: Element | string): void;
	unmount(): void;
};

export class MailboxConfigForm
{
	containerId: string;
	initialData: InitialData;

	#app: VueApplication | null = null;
	#state: FormState | null = null;

	constructor(options: MailboxConfigFormOptions = {})
	{
		this.containerId = options.containerId ?? 'mail-mailbox-config-container';
		this.initialData = options.initialData ?? {};
	}

	start(): void
	{
		const container = document.getElementById(this.containerId);
		if (!container)
		{
			return;
		}

		const connectionRequest = this.initialData.connectionRequest ?? readConnectionRequestFromSlider();
		const initialData: InitialData = connectionRequest
			? { ...this.initialData, connectionRequest }
			: this.initialData;

		this.#state = createFormState(initialData);
		this.#app = BitrixVue.createApp(App) as VueApplication;
		this.#app.config.globalProperties.loc = (
			phraseCode: string,
			replacements: Record<string, string> = {},
		): string => {
			return Loc.getMessage(phraseCode, replacements) ?? '';
		};
		this.#app.provide(formStateKey, this.#state);
		this.#app.mount(container);
	}

	destroy(): void
	{
		if (this.#app)
		{
			this.#app.unmount();
			this.#app = null;
		}

		this.#state = null;
	}
}
