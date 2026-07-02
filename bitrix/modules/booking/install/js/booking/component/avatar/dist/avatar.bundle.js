/* eslint-disable */
this.BX = this.BX || {};
this.BX.Booking = this.BX.Booking || {};
(function (exports, main_core, ui_avatar) {
	'use strict';

	// @vue/component
	const Avatar = {
		name: 'UiAvatar',
		props: {
			size: {
				type: Number,
				default: 36
			},
			userName: {
				type: String,
				default: ''
			},
			userpicPath: {
				type: String,
				default: null
			},
			baseColor: {
				type: String,
				default: null
			}
		},
		watch: {
			size(size) {
				this.avatar?.setSize(size);
			},
			userpicPath(path) {
				this.avatar?.removeUserPic();
				this.avatar?.setPic(path);
			},
			userName() {
				this.removeAvatar();
				this.renderAvatar();
			}
		},
		created() {
			this.createAvatar();
		},
		mounted() {
			this.renderAvatar();
		},
		updated() {
			this.renderAvatar();
		},
		methods: {
			createAvatar() {
				this.avatar = new ui_avatar.AvatarRound({
					size: this.size,
					userName: this.userName,
					userpicPath: this.userpicPath,
					baseColor: this.baseColor
				});
			},
			renderAvatar() {
				if (!this.avatar) {
					this.createAvatar();
				}
				this.avatar.renderTo(this.$refs.avatar);
			},
			removeAvatar() {
				main_core.Dom.clean(this.$refs.avatar);
				this.avatar = null;
			}
		},
		template: `
		<div ref="avatar"></div>
	`
	};

	exports.Avatar = Avatar;

})(this.BX.Booking.Component = this.BX.Booking.Component || {}, BX, BX.UI);
