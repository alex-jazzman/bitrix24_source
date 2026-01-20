import { Dom } from 'main.core';
import { AvatarRound } from 'ui.avatar';

// @vue/component
export const Avatar = {
	name: 'UiAvatar',
	props: {
		size: {
			type: Number,
			default: 36,
		},
		userName: {
			type: String,
			default: '',
		},
		userpicPath: {
			type: String,
			default: null,
		},
		baseColor: {
			type: String,
			default: null,
		},
	},
	watch: {
		size(size: number): void
		{
			this.avatar?.setSize(size);
		},
		userpicPath(path: string): void
		{
			this.avatar?.removeUserPic();
			this.avatar?.setPic(path);
		},
		userName(): void
		{
			this.removeAvatar();
			this.renderAvatar();
		},
	},
	created(): void
	{
		this.createAvatar();
	},
	mounted(): void
	{
		this.renderAvatar();
	},
	updated(): void
	{
		this.renderAvatar();
	},
	methods: {
		createAvatar(): void
		{
			this.avatar = new AvatarRound({
				size: this.size,
				userName: this.userName,
				userpicPath: this.userpicPath,
				baseColor: this.baseColor,
			});
		},
		renderAvatar(): void
		{
			if (!this.avatar)
			{
				this.createAvatar();
			}

			this.avatar.renderTo(this.$refs.avatar);
		},
		removeAvatar(): void
		{
			Dom.clean(this.$refs.avatar);
			this.avatar = null;
		},
	},
	template: `
		<div ref="avatar"></div>
	`,
};
