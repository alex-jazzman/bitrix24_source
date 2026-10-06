import { type Store } from 'ui.vue3.vuex';

import { OpenLinesManager } from 'imopenlines.v2.lib.openlines';

import { Core } from 'im.v2.application.core';
import { MessageComponent } from 'im.v2.const';
import { SmileManager } from 'im.v2.lib.smile-manager';
import { Utils } from 'im.v2.lib.utils';
import { type ImModelMessage } from 'im.v2.model';

import { serverComponentList, demoComponentList } from './const/message-components-lists';

export class MessageComponentManager
{
	#message: ImModelMessage;
	#store: Store;

	constructor(message: ImModelMessage)
	{
		this.#message = message;
		this.#store = Core.getStore();
	}

	getName(): $Values<typeof MessageComponent>
	{
		if (this.#isOpenLinesComponent())
		{
			return this.#getOpenLinesComponent();
		}

		if (this.#isDeletedMessage())
		{
			return MessageComponent.deleted;
		}

		if (this.#isServerComponent() || this.#isDemoComponent())
		{
			return this.#message.componentId;
		}

		if (this.#hasFiles())
		{
			return MessageComponent.file;
		}

		if (this.#isEmojiOnly() || this.#hasSmilesOnly())
		{
			return MessageComponent.smile;
		}

		if (this.#hasSticker())
		{
			return MessageComponent.sticker;
		}

		return MessageComponent.default;
	}

	#isOpenLinesComponent(): boolean
	{
		return Boolean(OpenLinesManager?.getMessageName(this.#message));
	}

	#getOpenLinesComponent(): string
	{
		return OpenLinesManager.getMessageName(this.#message);
	}

	#isServerComponent(): boolean
	{
		return serverComponentList.has(this.#message.componentId);
	}

	#isDemoComponent(): boolean
	{
		return demoComponentList.has(this.#message.componentId);
	}

	#hasFiles(): boolean
	{
		return this.#message.files.length > 0;
	}

	#hasText(): boolean
	{
		return this.#message.text.length > 0;
	}

	#hasAttach(): boolean
	{
		return this.#message.attach.length > 0;
	}

	#hasBuilderBlocks(): boolean
	{
		return this.#store.getters['messages/builder/hasBlocks'](this.#message.id);
	}

	#hasSticker(): boolean
	{
		return this.#store.getters['stickers/messages/isSticker'](this.#message.id);
	}

	#isEmptyMessage(): boolean
	{
		return !this.#hasText()
			&& !this.#hasFiles()
			&& !this.#hasAttach()
			&& !this.#hasSticker()
			&& !this.#hasBuilderBlocks();
	}

	#isDeletedMessage(): boolean
	{
		return this.#message.isDeleted || this.#isEmptyMessage();
	}

	#isEmojiOnly(): boolean
	{
		if (this.#isForward())
		{
			return false;
		}

		if (!this.#hasOnlyText())
		{
			return false;
		}

		return Utils.text.isEmojiOnly(this.#message.text);
	}

	#hasSmilesOnly(): boolean
	{
		if (this.#isForward())
		{
			return false;
		}

		if (!this.#hasOnlyText())
		{
			return false;
		}

		// todo: need to sync with getSmileRatio in lib/parser/src/functions/smile.js
		const smileManager = SmileManager.getInstance();
		const smiles = smileManager.smileList?.smiles ?? [];
		const sortedSmiles = [...smiles].sort((a, b) => {
			return b.typing.localeCompare(a.typing);
		});
		const pattern = sortedSmiles.map((smile) => {
			return Utils.text.escapeRegex(smile.typing);
		}).join('|');

		const replacedText = this.#message.text.replaceAll(new RegExp(pattern, 'g'), '');
		const hasOnlySmiles = replacedText.trim().length === 0;

		const matchOnlySmiles = new RegExp(`(?:(?:${pattern})\\s*){4,}`);

		return hasOnlySmiles && !matchOnlySmiles.test(this.#message.text);
	}

	#hasOnlyText(): boolean
	{
		if (!this.#hasText())
		{
			return false;
		}

		return !this.#hasFiles() && !this.#hasAttach();
	}

	#isForward(): boolean
	{
		return this.#store.getters['messages/isForward'](this.#message.id);
	}
}
