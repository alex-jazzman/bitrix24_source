import { Type } from 'main.core';
import { sendData } from 'ui.analytics';
import { type Store } from 'ui.vue3.vuex';

export class AnalyticsService
{
	#store: Store;

	constructor(params: { store: Store })
	{
		this.#store = params.store;
	}

	onRender(): void
	{
		this.#send({
			...this.#store.state.analytics.analytics,
			category: 'communication',
			event: 'view',
		});
	}

	onAddChannelClick(): void
	{
		this.#sendChannelConnect('menu_button');
	}

	onBannerConnectClick(id: string, connectStatus: ?string): void
	{
		this.#sendChannelConnect('banner_button', id, connectStatus);
	}

	onNoChannelsButtonClick(): void
	{
		this.#sendChannelConnect('no_connection_button');
	}

	#sendChannelConnect(element: string, id: ?string = null, connectStatus: ?string = null): void
	{
		const data = {
			...this.#store.state.analytics.analytics,
			category: 'communication',
			event: 'connect',
			type: 'channel',
			c_element: element,
		};

		if (Type.isStringFilled(id))
		{
			data.p2 = `channel_${this.#normalizeChannelId(id)}`;
		}

		if (Type.isStringFilled(connectStatus))
		{
			data.p3 = `connectStatus_${connectStatus}`;
		}

		this.#send(data);
	}

	#normalizeChannelId(channelId: string): string
	{
		return channelId.replaceAll('_', '-').replaceAll('~~~', '-');
	}

	onPreviewShow(): void
	{
		this.#sendEditorInteraction('preview');
	}

	onSelectTemplate(): void
	{
		this.#sendEditorInteraction('template_selector');
	}

	onSuggestTemplate(): void
	{
		this.#sendEditorInteraction('template_offer');
	}

	onSelectChannel(): void
	{
		this.#sendEditorInteraction('channel_selector');
	}

	onSaveChannelsSort(): void
	{
		this.#sendEditorInteraction('channel_list_change');
	}

	onContentProviderAction(element: string): void
	{
		this.#sendEditorInteraction('element_add', element);
	}

	#sendEditorInteraction(element: string, addedElement?: string): void
	{
		const data = {
			...this.#store.state.analytics.analytics,
			category: 'communication',
			event: 'edit',
			type: 'message',
			c_element: element,
		};

		const chanId = this.#store.getters['channels/current']?.id;
		if (Type.isStringFilled(chanId))
		{
			data.p5 = `channel_${this.#normalizeChannelId(chanId)}`;
		}

		if (Type.isStringFilled(addedElement))
		{
			data.p2 = `element_${addedElement}`;
		}

		this.#send(data);
	}

	onAddCopilot(): void
	{
		this.#send({
			...this.#store.state.analytics.analytics,
			category: 'communication',
			event: 'copilot',
			type: 'message',
		});
	}

	onSend(): void
	{
		const data = {
			...this.#store.state.analytics.analytics,
			category: 'communication',
			event: 'send',
			type: 'message',
		};

		if (this.#store.getters['channels/current']?.isTemplatesBased)
		{
			data.p3 = `template_${this.#store.getters['templates/current']?.ORIGINAL_ID}`;
		}

		const chanId = this.#store.getters['channels/current']?.id;
		if (Type.isStringFilled(chanId))
		{
			data.p5 = `channel_${this.#normalizeChannelId(chanId)}`;
		}

		this.#send(data);
	}

	onCancel(): void
	{
		this.#send({
			...this.#store.state.analytics.analytics,
			category: 'communication',
			event: 'cancel',
			type: 'message',
		});
	}

	#send(data: Object): void
	{
		sendData(this.#filterOutNilValues(data));
	}

	#filterOutNilValues(object: Object): Object
	{
		const result = {};

		Object.entries(object).forEach(([key, value]) => {
			if (!Type.isNil(value))
			{
				result[key] = value;
			}
		});

		return result;
	}
}
