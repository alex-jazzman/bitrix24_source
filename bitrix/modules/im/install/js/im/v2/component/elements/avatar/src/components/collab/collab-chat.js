import { type ImModelChat } from 'im.v2.model';
import { FeatureManager, Feature } from 'im.v2.lib.feature';

import { AvatarSize } from '../../const/const';
import { BaseUiAvatar, AvatarType } from '../base/base-ui-avatar';

// @vue/component
export const CollabChatAvatar = {
	name: 'CollabChatAvatar',
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
		withAvatarLetters: {
			type: Boolean,
			default: true,
		},
		customSource: {
			type: String,
			default: '',
		},
		withSpecialTypes: {
			type: Boolean,
			default: true,
		},
		withSpecialTypeIcon: {
			type: Boolean,
			default: true,
		},
		withTooltip: {
			type: Boolean,
			default: true,
		},
	},
	computed: {
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
		avatarType(): $Values<typeof AvatarType>
		{
			return this.useCollabV2Avatar ? AvatarType.collabV2 : AvatarType.collab;
		},
		backgroundColor(): string
		{
			return this.useCollabV2Avatar ? this.dialog.color : '';
		},
		useCollabV2Avatar(): boolean
		{
			return this.isCollabV2Available && !this.dialog.containsCollaber;
		},
		isCollabV2Available(): boolean
		{
			return FeatureManager.isFeatureAvailable(Feature.isCollabV2Available);
		},
		avatarKey(): string
		{
			return `${this.dialogId}_${this.avatarType}`;
		},
	},
	template: `
		<BaseUiAvatar
			:type="avatarType"
			:key="avatarKey" 
			:title="dialogName" 
			:size="size" 
			:url="dialogAvatarUrl"
			:backgroundColor="backgroundColor"
		/>
	`,
};
