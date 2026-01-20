import { Builder, Dictionary } from 'crm.integration.analytics';
import { sendData } from 'ui.analytics';
import type { Store } from 'ui.vue3.vuex';

export class AnalyticsService
{
	#store: Store;

	constructor(params: { store: Store })
	{
		this.#store = params.store;
	}

	onRender(): void
	{
		const event = new Builder.Communication.Editor.ViewEvent();

		event
			.setSection(this.#store.state.analytics.analytics.c_section)
			.setSubSection(this.#store.state.analytics.analytics.c_sub_section)
		;

		sendData(event.buildData());
	}

	onAddChannelClick(): void
	{
		this.#sendChannelConnect(Dictionary.ELEMENT_MENU_BUTTON);
	}

	onBannerConnectClick(id: string, connectStatus: ?string): void
	{
		this.#sendChannelConnect(Dictionary.ELEMENT_BANNER_BUTTON, id, connectStatus);
	}

	onNoChannelsButtonClick(): void
	{
		this.#sendChannelConnect(Dictionary.ELEMENT_NO_CONNECTION_BUTTON);
	}

	#sendChannelConnect(element: string, id: string, connectStatus: ?string): void
	{
		const event = new Builder.Communication.Channel.ConnectEvent();

		event
			.setSection(this.#store.state.analytics.analytics.c_section)
			.setSubSection(this.#store.state.analytics.analytics.c_sub_section)
			.setElement(element)
			.setChannelId(id)
			.setConnectStatus(connectStatus)
		;

		sendData(event.buildData());
	}

	onPreviewShow(): void
	{
		this.#sendEditorInteraction(Dictionary.ELEMENT_PREVIEW);
	}

	onSelectTemplate(): void
	{
		this.#sendEditorInteraction(Dictionary.ELEMENT_TEMPLATE_SELECTOR);
	}

	onSuggestTemplate(): void
	{
		this.#sendEditorInteraction(Dictionary.ELEMENT_TEMPLATE_OFFER);
	}

	onSelectChannel(): void
	{
		this.#sendEditorInteraction(Dictionary.ELEMENT_CHANNEL_SELECTOR);
	}

	onSaveChannelsSort(): void
	{
		this.#sendEditorInteraction(Dictionary.ELEMENT_CHANNEL_LIST_CHANGE);
	}

	onAddFile(): void
	{
		this.#sendEditorInteraction(Dictionary.ELEMENT_ELEMENT_ADD, 'file');
	}

	onAddDocument(): void
	{
		this.#sendEditorInteraction(Dictionary.ELEMENT_ELEMENT_ADD, 'document');
	}

	onAddSalescenterPage(): void
	{
		this.#sendEditorInteraction(Dictionary.ELEMENT_ELEMENT_ADD, 'salescenterPage');
	}

	onAddSalescenterPayment(): void
	{
		this.#sendEditorInteraction(Dictionary.ELEMENT_ELEMENT_ADD, 'salescenterPayment');
	}

	onAddSalescenterCompilation(): void
	{
		this.#sendEditorInteraction(Dictionary.ELEMENT_ELEMENT_ADD, 'salescenterCompilation');
	}

	onAddCrmValue(): void
	{
		this.#sendEditorInteraction(Dictionary.ELEMENT_ELEMENT_ADD, 'crmValue');
	}

	#sendEditorInteraction(element: string, addedElement?: string): void
	{
		const event = Builder.Communication.Editor.InteractionEvent.createDefault(
			this.#store.getters['channels/current']?.id,
		);

		event
			.setSection(this.#store.state.analytics.analytics.c_section)
			.setSubSection(this.#store.state.analytics.analytics.c_sub_section)
			.setElement(element)
			.setAddedElement(addedElement)
		;

		sendData(event.buildData());
	}

	onAddCopilot(): void
	{
		const event = new Builder.Communication.Editor.CopilotEvent();

		event
			.setSection(this.#store.state.analytics.analytics.c_section)
			.setSubSection(this.#store.state.analytics.analytics.c_sub_section)
		;

		sendData(event.buildData());
	}

	onSend(): void
	{
		const event = Builder.Communication.Editor.SendEvent.createDefault(
			this.#store.getters['channels/current']?.id,
		);

		event
			.setSection(this.#store.state.analytics.analytics.c_section)
			.setSubSection(this.#store.state.analytics.analytics.c_sub_section)
		;

		if (this.#store.getters['channels/current']?.isTemplatesBased)
		{
			event.setTemplateId(this.#store.getters['templates/current']?.ORIGINAL_ID);
		}

		sendData(event.buildData());
	}

	onCancel(): void
	{
		const event = new Builder.Communication.Editor.CancelEvent();

		event
			.setSection(this.#store.state.analytics.analytics.c_section)
			.setSubSection(this.#store.state.analytics.analytics.c_sub_section)
		;

		sendData(event.buildData());
	}
}
