import { Loc, Type, Dom } from 'main.core';
import { Item } from './item.js';

type ActionItemConfig = {
	actionId?: ?string,
	messageId?: ?(string | number),
	messageSimpleId?: ?(string | number),
	errorType?: ?string,
};

type ActionDescriptor = {
	className?: string,
	textKey: string,
	titleKey: string,
	data?: ((config: ActionItemConfig) => Object) | Object,
	onClick?: (config: ActionItemConfig, event: MouseEvent) => void,
};

const ActionRegistry = {
	discuss_in_chat: {
		className: 'mail-binding-chat mail-ui-not-active mail-discuss-in-chat-btn js-mail-discuss-in-chat',
		textKey: 'MAIL_BINDING_CUSTOM_CHAT_MESSAGE_TEXT',
		titleKey: 'MAIL_BINDING_CUSTOM_CHAT_MESSAGE_TITLE',
		data: (config: ActionItemConfig) => ({
			messageId: config.messageSimpleId ?? config.messageId,
			entityType: 'action',
			entityId: config.actionId,
		}),
		onClick: (config: ActionItemConfig) => {
			ActionItem.openDiscussInChat(config);
		},
	},
};

export class ActionItem
{
	static initButtons(context: HTMLElement = document.body): void
	{
		const elements = [...context.getElementsByClassName('mail-ui-action-data')];
		for (const element of elements)
		{
			this.replaceElement((element: HTMLElement));
		}
	}

	static replaceElement(object: HTMLElement): void
	{
		const actionType = object.getAttribute('action-type');
		const actionId = object.getAttribute('action-id');
		const messageId = object.getAttribute('message-id');
		const messageSimpleId = object.getAttribute('message-simple-id');
		const errorType = object.getAttribute('error-type');

		if (actionType !== 'action')
		{
			return;
		}

		const newObject = this.render({
			actionId,
			messageId,
			messageSimpleId,
			errorType,
		});

		if (newObject)
		{
			Dom.replace(object, newObject);
		}
	}

	static render(config: ActionItemConfig): ?HTMLElement
	{
		const action = this.getActionDescriptor(config);
		if (!action)
		{
			return null;
		}

		const { text, title } = this.getActionText(action);
		const className = action.className || '';
		const data = this.getActionData(action, config);
		const onClick = this.getActionClickHandler(action, config);

		return Item.renderButton({
			text,
			title,
			className,
			messageSimpleId: config.messageSimpleId,
			useBindClass: false,
			data,
			onClick,
		});
	}

	static getActionDescriptor(config: ActionItemConfig): ?ActionDescriptor
	{
		if (!Type.isObject(config) || !config.actionId)
		{
			return null;
		}

		return ActionRegistry[config.actionId] || null;
	}

	static getActionText(action: ActionDescriptor): { text: string, title: string }
	{
		const text = Loc.getMessage(action.textKey) || '';
		const title = Loc.getMessage(action.titleKey) || text;

		return { text, title };
	}

	static getActionData(action: ActionDescriptor, config: ActionItemConfig): Object
	{
		if (Type.isFunction(action.data))
		{
			return action.data(config);
		}

		if (Type.isObject(action.data))
		{
			return action.data;
		}

		return {};
	}

	static getActionClickHandler(action: ActionDescriptor, config: ActionItemConfig): ?Function
	{
		const hasError = this.hasError(config);
		const hasAction = Type.isFunction(action.onClick);

		if (!hasError && !hasAction)
		{
			return null;
		}

		return (event: MouseEvent) => {
			if (this.handleErrorClick(event, config))
			{
				return;
			}

			event.preventDefault();

			action.onClick(config, event);
		};
	}

	static hasError(config: ActionItemConfig): boolean
	{
		return Boolean(config.errorType && Item.isErrorKey(config.errorType));
	}

	static handleErrorClick(event: MouseEvent, config: ActionItemConfig): boolean
	{
		if (!this.hasError(config))
		{
			return false;
		}

		event.preventDefault();
		event.stopImmediatePropagation();

		Item.showError(config.errorType);

		return true;
	}

	static openDiscussInChat(config: ActionItemConfig): void
	{
		const messageId = this.getActionMessageId(config);
		if (!messageId)
		{
			return;
		}

		const discuss = BX?.Mail?.Client?.Action?.DiscussInChat;
		if (discuss && Type.isFunction(discuss.open))
		{
			discuss.open(messageId);
		}
	}

	static getActionMessageId(config: ActionItemConfig): ?number
	{
		const candidates = [config.messageSimpleId, config.messageId];
		for (const candidate of candidates)
		{
			if (candidate === undefined || candidate === null)
			{
				continue;
			}

			const preparedId = parseInt(String(candidate), 10);
			if (Type.isInteger(preparedId))
			{
				return preparedId;
			}
		}

		return null;
	}
}
