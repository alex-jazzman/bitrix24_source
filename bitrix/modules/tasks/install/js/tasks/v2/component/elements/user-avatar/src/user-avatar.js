import { AvatarBase, AvatarRoundGuest, AvatarRoundExtranet } from 'ui.avatar';
import { UserAvatarSize, UserAvatarSizeMap } from './user-avatar-size';
import './user-avatar.css';

const USER_TYPES = {
	EMPLOYEE: 'employee',
	COLLABER: 'collaber',
	EXTRANET: 'extranet',
};

// @vue/component
export const UserAvatar = {
	name: 'UiUserAvatar',
	props: {
		src: {
			type: String,
			default: '',
		},
		type: {
			type: String,
			default: USER_TYPES.EMPLOYEE,
		},
		size: {
			type: String,
			default: UserAvatarSize.S,
		},
		borderColor: {
			type: String,
			default: undefined,
		},
	},
	computed: {
		normalizedSrc(): string
		{
			return this.src === null ? '' : this.src;
		},
		isCollaber(): string
		{
			return (this.type === USER_TYPES.COLLABER);
		},
		isExtranet(): string
		{
			return (this.type === USER_TYPES.EXTRANET);
		},
		colorAvatar(): string
		{
			let colorAvatarNew = '#858D95';

			if (this.isCollaber)
			{
				colorAvatarNew = '#19CC45';
			}

			if (this.isExtranet)
			{
				colorAvatarNew = '#ca8600';
			}

			return colorAvatarNew;
		},
		ClassComponentAvatar(): string
		{
			let ClassComponentAvatarNew = AvatarBase;

			if (this.isCollaber)
			{
				ClassComponentAvatarNew = AvatarRoundGuest;
			}

			if (this.isExtranet)
			{
				ClassComponentAvatarNew = AvatarRoundExtranet;
			}

			return ClassComponentAvatarNew;
		},
		optionsAvatar(): string
		{
			return {
				size: UserAvatarSizeMap[this.size],
				picPath: encodeURI(this.normalizedSrc),
				baseColor: this.colorAvatar,
				borderColor: this.borderColor,
			};
		},
	},
	watch: {
		normalizedSrc(): void
		{
			this.render();
		},
	},
	mounted(): void
	{
		this.render();
	},
	methods: {
		render(): void
		{
			this.avatar?.getContainer()?.remove();
			this.avatar = new (this.ClassComponentAvatar)(this.optionsAvatar);
			this.avatar.renderTo(this.$refs.container);
		},
	},
	template: `
		<div class="b24-user-avatar" ref="container"/>
	`,
};
