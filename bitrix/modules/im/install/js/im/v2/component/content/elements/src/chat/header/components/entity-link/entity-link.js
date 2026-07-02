import { type ImModelChat } from 'im.v2.model';

import { ParamsByLinkType } from './const/chat-type-params';
import { EntityButton } from '../entity-button/entity-button.js';

// @vue/component
export const EntityLink = {
	name: 'EntityLink',
	components: { EntityButton },
	props: {
		dialogId: {
			type: String,
			required: true,
		},
	},
	computed:
	{
		dialog(): ImModelChat
		{
			return this.$store.getters['chats/get'](this.dialogId, true);
		},
		entityType(): string
		{
			return this.dialog.entityLink.type;
		},
		entityUrl(): string
		{
			return this.dialog.entityLink.url;
		},
		linkText(): string
		{
			return ParamsByLinkType[this.entityType]?.loc ?? 'Open entity';
		},
	},
	template: `
		<EntityButton :text="linkText" :url="entityUrl" />
	`,
};
