import { AvatarBase, AvatarRoundGuest } from 'ui.avatar';
import { UserAvatarSize, UserAvatarSizeMap } from './user-avatar-size';
import './user-avatar.css';

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
			default: 'employee',
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
			const isExternal = this.type === 'collaber' || this.type === 'extranet';

			this.avatar?.getContainer()?.remove();
			const AvatarClass = isExternal ? AvatarRoundGuest : AvatarBase;
			this.avatar = new (AvatarClass)({
				size: UserAvatarSizeMap[this.size],
				picPath: encodeURI(this.normalizedSrc),
				baseColor: isExternal ? null : '#858D95',
				borderColor: this.borderColor,
			});
			this.avatar.renderTo(this.$refs.container);
		},
	},
	template: `
		<div class="b24-user-avatar" ref="container"/>
	`,
};
