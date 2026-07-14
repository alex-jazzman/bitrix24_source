/* eslint-disable */
this.BX = this.BX || {};
this.BX.Socialnetwork = this.BX.Socialnetwork || {};
this.BX.Socialnetwork.V2 = this.BX.Socialnetwork.V2 || {};
this.BX.Socialnetwork.V2.Components = this.BX.Socialnetwork.V2.Components || {};
(function (exports, ui_notification, ui_uploader_core, ui_vue3_components_avatar) {
	'use strict';

	const pathAvatarDefault = '/bitrix/js/socialnetwork/v2/application/project-wizard/images/project-v2-avatar.svg';
	const sizeAvatarDefault = 60;
	const borderColourAvatarDefault = '#0075FF';
	const borderInnerColourDefault = '#fff';

	// @vue/component
	const UiAvatarProject = {
		name: 'UiAvatarProject',
		components: {
			UiAvatar: ui_vue3_components_avatar.Avatar
		},
		props: {
			url: {
				type: String,
				default: ''
			}
		},
		emits: ['update'],
		data() {
			return {
				uploader: null
			};
		},
		computed: {
			avatarType() {
				return 'hexagon-accent';
			},
			avatarUrl() {
				return this.url || pathAvatarDefault;
			},
			avatarOptions() {
				return {
					size: sizeAvatarDefault,
					borderColor: borderColourAvatarDefault,
					borderInnerColor: borderInnerColourDefault,
					userpicPath: this.avatarUrl
				};
			}
		},
		mounted() {
			this.uploader = new ui_uploader_core.Uploader({
				browseElement: this.$refs.uploaderContainer,
				assignServerFile: false,
				acceptedFileTypes: ['.jpg', '.jpeg', '.png'],
				maxFileSize: 1024 * 1024 * 5,
				// 5 MB

				events: {
					[ui_uploader_core.UploaderEvent.FILE_LOAD_COMPLETE]: event => {
						const file = event.getData().file;
						this.$emit('update', file);
					},
					[ui_uploader_core.UploaderEvent.FILE_ERROR]: event => {
						const error = event.getData().error;
						const errorMessage = error.getMessage();
						ui_notification.UI.Notification.Center.notify({
							content: errorMessage
						});
					}
				}
			});
		},
		methods: {
			removeCurrentAvatar() {
				if (this.uploader) {
					this.uploader.removeFiles();
				}
				this.$emit('update', null);
			}
		},
		template: `
		<div
			class="socialnetwork-avatar-project"
			ref="uploaderContainer"
		>
			<UiAvatar
				:key="avatarUrl"
				:type="avatarType"
				:options="avatarOptions"
				class="socialnetwork-avatar-project__visual"
			/>
		</div>
	`
	};

	exports.UiAvatarProject = UiAvatarProject;

})(this.BX.Socialnetwork.V2.Components.Elements = this.BX.Socialnetwork.V2.Components.Elements || {}, BX.UI.Notification, BX.UI.Uploader, BX.UI.Vue3.Components);
//# sourceMappingURL=ui-avatar-project.bundle.js.map
