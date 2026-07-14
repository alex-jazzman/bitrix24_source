import {
	AvatarRoundMarta,
	AvatarHexagonGuest,
	AvatarHexagonProject,
	AvatarRoundExtranet,
	AvatarRoundGuest,
	AvatarRoundCopilot,
	AvatarBase,
} from 'ui.avatar';
import { AvatarSize, AvatarSizeMap } from '../../const/const';

import './css/base-ui-avatar.css';

export const AvatarType = {
	extranet: 'extranet',
	collaber: 'collaber',
	collab: 'collab',
	collabV2: 'collabV2',
	copilot: 'copilot',
	default: 'default',
	aiAssistantMarta: 'aiAssistantMarta',
};

const AvatarClassByChatType = {
	[AvatarType.extranet]: AvatarRoundExtranet,
	[AvatarType.collaber]: AvatarRoundGuest,
	[AvatarType.collab]: AvatarHexagonGuest,
	[AvatarType.collabV2]: AvatarHexagonProject,
	[AvatarType.copilot]: AvatarRoundCopilot,
	[AvatarType.aiAssistantMarta]: AvatarRoundMarta,
	default: AvatarBase,
};

// @vue/component
export const BaseUiAvatar = {
	props: {
		type: {
			type: String,
			required: true,
			validator(value): boolean
			{
				return Object.values(AvatarType).includes(value);
			},
		},
		/**
		 * Optional override
		 */
		avatarClass: {
			type: Function,
			default: null,
		},
		size: {
			type: String,
			default: AvatarSize.M,
		},
		url: {
			type: String,
			default: '',
		},
		title: {
			type: String,
			default: '',
		},
		backgroundColor: {
			type: String,
			default: '',
		},
	},
	computed: {
		AvatarSize: () => AvatarSize,
		calculatedSize(): number
		{
			return AvatarSizeMap[this.size];
		},
	},
	watch: {
		type()
		{
			this.updateAvatarType();
		},
		avatarClass()
		{
			this.updateAvatarType();
		},
		title()
		{
			this.avatar.setTitle(this.title);
		},
		url()
		{
			this.setAvatarImage();
		},
		backgroundColor()
		{
			this.setBackgroundColor();
		},
	},
	created()
	{
		this.initAvatarClass();
	},
	mounted()
	{
		this.renderAvatar();
	},
	methods: {
		initAvatarClass()
		{
			const AvatarClass = this.avatarClass || AvatarClassByChatType[this.type] || AvatarClassByChatType.default;
			this.avatar = new AvatarClass({
				size: this.calculatedSize,
				title: this.title,
			});

			this.setAvatarImage();
			this.setBackgroundColor();
		},
		renderAvatar()
		{
			if (!this.avatar || !this.$refs.avatarContainer)
			{
				return;
			}

			this.avatar.renderTo(this.$refs.avatarContainer);
		},
		setAvatarImage()
		{
			if (!this.url)
			{
				this.avatar.removeUserPic();
				this.avatar.setTitle(this.title);

				return;
			}

			this.avatar.setUserPic(this.url);
		},
		setBackgroundColor()
		{
			if (!this.backgroundColor)
			{
				return;
			}

			this.avatar.setBaseColor(this.backgroundColor);
		},

		updateAvatarType()
		{
			this.$refs.avatarContainer.innerHTML = '';
			this.initAvatarClass();
			this.renderAvatar();
		},
	},
	template: `
		<div class="bx-im-base-ui-avatar__container" ref="avatarContainer"></div>
	`,
};
