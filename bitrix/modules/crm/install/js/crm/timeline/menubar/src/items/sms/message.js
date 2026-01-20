import { type Receiver } from 'crm.messagesender';
import { type Backend, type Channel, type Editor as EditorType } from 'crm.messagesender.editor';
import { Runtime, Tag, Type } from 'main.core';
import { type BaseEvent, EventEmitter } from 'main.core.events';
import Item from '../../item';

export type ResendParams = {
	backend: Backend,
	fromId: string,
	client: {
		entityTypeId: number,
		entityId: number,
		value: string,
	},
	text: string,
	template: Object,
};

/** @memberof BX.Crm.Timeline.MenuBar */
export default class Message extends Item
{
	#isRendered: Boolean = false;
	#editor: EditorType = null;

	createLayout(): HTMLElement
	{
		const container = Tag.render`<div class="crm-entity-stream-content-new-detail --hidden"></div>`;
		if (!this.#shouldRender())
		{
			return container;
		}

		const skeleton = new BX.Crm.MessageSender.Editor.Skeleton.Skeleton({
			layout: this.getSetting('editor').layout,
		});
		skeleton.renderTo(container);

		for (const tourString of this.getSetting('tours', []))
		{
			if (Type.isStringFilled(tourString))
			{
				Runtime.html(null, tourString);
			}
		}

		return container;
	}

	onShow()
	{
		super.onShow();

		void this.#renderEditor();
	}

	async #renderEditor(): Promise<void>
	{
		if (this.#isRendered)
		{
			return;
		}

		if (!this.#shouldRender())
		{
			return;
		}

		const { Editor } = await Runtime.loadExtension('crm.messagesender.editor');

		/** @see BX.Crm.MessageSender.Editor */
		this.#editor = new Editor({
			...this.getSetting('editor'),
			renderTo: this.getContainer(),
		});

		await this.#editor.render();

		this.#isRendered = true;
		this.#bindEvents();

		if (Type.isArrayFilled(this.#editor.getOptions().promoBanners))
		{
			EventEmitter.emit('BX.Crm.Timeline.MenuBar.Message:ShowNewChannelsAvailableTour', {
				stepId: 'menubar-message-new-channels-available',
				target: this.getContainer().querySelector('[data-role="header-left"]'),
			});
		}
	}

	#shouldRender(): boolean
	{
		return Boolean(this.getSetting('shouldRender'));
	}

	#bindEvents(): void
	{
		EventEmitter.subscribe('BX.Crm.MessageSender.ReceiverRepository:OnReceiversChanged', (event: BaseEvent) => {
			const { item } = event.getData();

			if (this.getEntityTypeId() !== item?.entityTypeId || this.getEntityId() !== item?.entityId)
			{
				return;
			}

			void this.#editor?.reload();
		});

		EventEmitter.subscribeOnce('BX.Crm.Tour.EntityDetailsMenubar.Message:onConnectionsSliderClose', async () => {
			void this.#editor?.reload();

			const analytics = this.getSetting('analytics', {});

			const { Builder, Dictionary, sendData } = await Runtime.loadExtension('crm.integration.analytics', 'ui.analytics');

			const event = (new Builder.Communication.Channel.ConnectEvent())
				.setSection(analytics.c_section)
				.setSubSection(analytics.c_sub_section)
				.setElement(Dictionary.ELEMENT_AHA_MOMENT)
			;

			sendData(event.buildData());
		});

		const hide = () => {
			setTimeout(() => this.emitFinishEditEvent(), 50);
		};

		this.#editor.subscribe('onSendSuccess', hide);
		this.#editor.subscribe('onCancel', hide);
	}

	/**
	 * @public
	 */
	shouldConfirmStateChange(params: ResendParams): boolean
	{
		if (!this.#isRendered)
		{
			return false;
		}

		const { text, template } = params;

		const state = this.#editor?.getState() ?? {};

		const isCustomTextChannel = Type.isNil(state.notificationTemplate) && Type.isNil(state.template);
		const isWantCustomTextChannel = Type.isNil(template) && Type.isStringFilled(text);

		if (!isCustomTextChannel && isWantCustomTextChannel)
		{
			return true;
		}

		if (isCustomTextChannel && isWantCustomTextChannel)
		{
			return Type.isStringFilled(state.message.body.trim()) && state.message.body.trim() !== text.trim();
		}

		if (isCustomTextChannel && !isWantCustomTextChannel)
		{
			return Type.isStringFilled(state.message.body.trim());
		}

		if (!isCustomTextChannel && !isWantCustomTextChannel)
		{
			const templateId = template?.ORIGINAL_ID;
			const filledPlaceholders = template?.FILLED_PLACEHOLDERS ?? [];

			const currentTemplateId = state.template?.ORIGINAL_ID;
			const currentFilledPlaceholders = state.template?.FILLED_PLACEHOLDERS ?? [];

			return Type.isNumber(templateId) && templateId > 0
				&& Type.isNumber(currentTemplateId) && currentTemplateId > 0
				&& (
					templateId !== currentTemplateId
					|| JSON.stringify(filledPlaceholders) !== JSON.stringify(currentFilledPlaceholders)
				);
		}

		throw new Error('Unexpected state in BX.Crm.Timeline.MenuBar.Item.Message.#shouldConfirmStateChange');
	}

	/**
	 * @public
	 */
	async tryToResend(params: ResendParams): Promise<void>
	{
		await this.#renderEditor();

		this.#setState(params);

		const editorState = this.#editor.getState();
		const analytics = this.getSetting('analytics', {});

		const { Builder, sendData } = await Runtime.loadExtension('crm.integration.analytics', 'ui.analytics');

		const eventData = Builder.Communication.Editor.ResendEvent.createDefault(editorState.channel?.id)
			.setSection(analytics.c_section)
			.setSubSection(analytics.c_sub_section)
			.setTemplateId(editorState.template?.ORIGINAL_ID)
			.buildData()
		;

		sendData(eventData);
	}

	#setState(params: ResendParams): void
	{
		if (!this.#isRendered)
		{
			return;
		}

		if (Type.isStringFilled(params?.backend?.senderCode) && Type.isStringFilled(params?.backend.id))
		{
			const chan = this.#editor.getOptions().channels.find((candidate: Channel) => {
				const isSameBackend = (
					candidate.backend.senderCode === params.backend.senderCode
					&& candidate.backend.id === params.backend.id
				);

				if (Type.isStringFilled(params?.fromId))
				{
					return isSameBackend && candidate.fromList.some((from) => from.id === params.fromId);
				}

				return isSameBackend;
			});

			if (chan)
			{
				this.#editor.setChannel(chan.id);

				if (Type.isStringFilled(params?.fromId))
				{
					this.#editor.setFrom(params.fromId);
				}
			}
		}

		if (Type.isPlainObject(params?.client))
		{
			const chan = this.#editor.getState().channel;

			const receiver: ?Receiver = chan.toList.find((candidate: Receiver) => {
				return candidate.addressSource.entityTypeId === params.client.entityTypeId
					&& candidate.addressSource.entityId === params.client.entityId
					&& candidate.address.value === params.client.value
				;
			});

			if (receiver)
			{
				this.#editor.setTo(receiver.address.id);
			}
		}

		if (Type.isStringFilled(params?.text))
		{
			this.#editor.setMessageText(params.text);
		}

		if (Type.isPlainObject(params?.template))
		{
			this.#editor.setTemplate(params.template.ORIGINAL_ID);

			for (const placeholder of (params.template?.FILLED_PLACEHOLDERS ?? []))
			{
				this.#editor.setFilledPlaceholder(placeholder);
			}
		}
	}
}
