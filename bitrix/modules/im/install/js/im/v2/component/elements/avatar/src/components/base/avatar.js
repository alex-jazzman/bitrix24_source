import { AvatarSquare } from 'ui.avatar';

import { ChatType } from 'im.v2.const';
import { type ImModelChat } from 'im.v2.model';

import { AvatarSize } from '../../const/const';
import { BaseUiAvatar, AvatarType } from './base-ui-avatar';

import './css/avatar.css';

// Chat types rendered with a round avatar and letters/photo (i.e. not a square special placeholder).
const COMMON_TYPES = new Set([
	ChatType.user,
	ChatType.chat,
	ChatType.open,
	ChatType.lines,
	ChatType.copilot,
	ChatType.taskComments,
]);

// Special types that still show letters (in a square) instead of a chat-type icon.
const TYPES_WITH_LETTERS = new Set([
	ChatType.openChannel,
	ChatType.channel,
	ChatType.taskComments,
]);

const SIZES_WITH_TEXT = new Set([AvatarSize.M, AvatarSize.L, AvatarSize.XL, AvatarSize.XXL, AvatarSize.XXXL]);

/**
 * Default avatar branch built on top of the design-system avatar (`ui.avatar`).
 * Used instead of `LegacyAvatar` when the Air design is enabled.
 *
 * Content priority (mirrors the legacy component): photo -> initials -> chat-type icon placeholder.
 * Regular users and group/open chats render as a round `AvatarRound`; special chat types
 * render as a square `AvatarSquare` with the chat-type icon layered on top as an im overlay.
 */
// @vue/component
export const Avatar = {
	name: 'MessengerAvatar',
	components: { BaseUiAvatar },
	props: {
		dialogId: {
			type: [String, Number],
			default: 0,
		},
		// Accepted for prop-compatibility with the dispatcher; not used by this branch.
		contextDialogId: {
			type: [String, Number, null],
			default: null,
		},
		customSource: {
			type: String,
			default: '',
		},
		size: {
			type: String,
			default: AvatarSize.M,
		},
		withAvatarLetters: {
			type: Boolean,
			default: true,
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
		backgroundColor: {
			type: String,
			default: '',
		},
	},
	data(): Object
	{
		return {
			isImageBroken: false,
		};
	},
	computed: {
		AvatarType: () => AvatarType,
		dialog(): ImModelChat
		{
			return this.$store.getters['chats/get'](this.dialogId, true);
		},
		isSpecialType(): boolean
		{
			return !COMMON_TYPES.has(this.dialog.type);
		},
		isSquare(): boolean
		{
			return this.withSpecialTypes && this.isSpecialType;
		},
		avatarClass(): ?Function
		{
			return this.isSquare ? AvatarSquare : null;
		},
		avatarUrl(): string
		{
			return this.customSource.length > 0 ? this.customSource : this.dialog.avatar;
		},
		// An image that is still loading counts as displayed: it is already in the avatar,
		// so nothing must take its place until we know it cannot be shown.
		hasImage(): boolean
		{
			return Boolean(this.avatarUrl) && !this.isImageBroken;
		},
		isEnoughSizeForText(): boolean
		{
			return SIZES_WITH_TEXT.has(this.size.toUpperCase());
		},
		showAvatarLetters(): boolean
		{
			if (TYPES_WITH_LETTERS.has(this.dialog.type))
			{
				return true;
			}

			return !this.isSpecialType;
		},
		hasLetters(): boolean
		{
			return this.withAvatarLetters && this.showAvatarLetters && this.isEnoughSizeForText && Boolean(this.dialog.name);
		},
		showTypeIcon(): boolean
		{
			return !this.hasImage && !this.hasLetters;
		},
		avatarTitle(): string
		{
			// Pass the title only when initials should be shown, so the DS base doesn't
			// derive initials where a chat-type icon must be rendered instead.
			return this.hasLetters ? this.dialog.name : '';
		},
		// The base under the image is hidden once the image is painted, so the colour is always
		// passed: while the image is pending it is the chat colour that fills the avatar.
		computedBackgroundColor(): string
		{
			return this.backgroundColor || this.dialog.color;
		},
		typeIconClasses(): string[]
		{
			const typeClass = ChatType[this.dialog.type] ? `--${this.dialog.type}` : '--default';

			return [typeClass];
		},
		containerTitle(): string
		{
			return this.withTooltip ? this.dialog.name : '';
		},
	},
	watch: {
		avatarUrl()
		{
			this.isImageBroken = false;
		},
	},
	methods: {
		handleImageDisplayStateChange(isDisplayed: boolean)
		{
			this.isImageBroken = !isDisplayed;
		},
	},
	template: `
		<div class="bx-im-avatar__scope" :title="containerTitle">
			<!-- The DS silhouette is never used here: the image, the letters or the type icon take its place -->
			<BaseUiAvatar
				:type="AvatarType.default"
				:avatarClass="avatarClass"
				:size="size"
				:url="avatarUrl"
				:title="avatarTitle"
				:backgroundColor="computedBackgroundColor"
				:withDefaultUserpic="false"
				@imageDisplayStateChange="handleImageDisplayStateChange"
			/>
			<div v-if="showTypeIcon" class="bx-im-avatar__type-icon" :class="typeIconClasses"></div>
		</div>
	`,
};
