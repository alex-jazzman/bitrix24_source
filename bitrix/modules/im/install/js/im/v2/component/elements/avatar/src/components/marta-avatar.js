import { type ImModelChat } from 'im.v2.model';

import { AvatarSize } from '../const/const';
import { BaseUiAvatar, AvatarType } from './base/base-ui-avatar';

// @vue/component
export const MartaAvatar = {
	name: 'MartaAvatar',
	components: { BaseUiAvatar },
	props: {
		dialogId: {
			type: [String, Number],
			default: 0,
		},
		size: {
			type: String,
			default: AvatarSize.M,
		},
	},
	computed:
		{
			AvatarType: () => AvatarType,
			dialog(): ImModelChat
			{
				return this.$store.getters['chats/get'](this.dialogId, true);
			},
			dialogName(): string
			{
				return this.dialog.name;
			},
			dialogAvatarUrl(): string
			{
				return this.dialog.avatar;
			},
		},
	template: `
		<BaseUiAvatar
			:type="AvatarType.aiAssistantMarta"
			:title="dialogName"
			:size="size"
			:url="dialogAvatarUrl"
		/>
	`,
};
