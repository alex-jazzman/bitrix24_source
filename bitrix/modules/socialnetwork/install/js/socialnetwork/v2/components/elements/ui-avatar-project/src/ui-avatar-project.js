import { type BaseEvent } from 'main.core.events';
import { UI } from 'ui.notification';
import { Uploader, UploaderEvent } from 'ui.uploader.core';
import { Avatar, type AvatarType } from 'ui.vue3.components.avatar';

import './ui-avatar-project.css';

const pathAvatarDefault = '/bitrix/js/socialnetwork/v2/application/project-wizard/images/project-v2-avatar.svg';
const sizeAvatarDefault = 60;
const borderColourAvatarDefault = '#0075FF';
const borderInnerColourDefault = '#fff';

// @vue/component
export const UiAvatarProject = {
	name: 'UiAvatarProject',
	components: {
		UiAvatar: Avatar,
	},
	props: {
		url: {
			type: String,
			default: '',
		},
	},
	emits: [
		'update',
	],
	data(): { uploader: Uploader | null }
	{
		return {
			uploader: null,
		};
	},
	computed: {
		avatarType(): AvatarType
		{
			return 'hexagon-accent';
		},
		avatarUrl(): AvatarType
		{
			return this.url || pathAvatarDefault;
		},
		avatarOptions(): Object
		{
			return {
				size: sizeAvatarDefault,
				borderColor: borderColourAvatarDefault,
				borderInnerColor: borderInnerColourDefault,
				userpicPath: this.avatarUrl,
			};
		},
	},
	mounted(): void
	{
		this.uploader = new Uploader({
			browseElement: this.$refs.uploaderContainer,
			assignServerFile: false,
			acceptedFileTypes: ['.jpg', '.jpeg', '.png'],
			maxFileSize: 1024 * 1024 * 5, // 5 MB

			events: {
				[UploaderEvent.FILE_LOAD_COMPLETE]: (event: BaseEvent): void => {
					const file = event.getData().file;
					this.$emit('update', file);
				},
				[UploaderEvent.FILE_ERROR]: (event: BaseEvent): void => {
					const error = event.getData().error;
					const errorMessage = error.getMessage();

					UI.Notification.Center.notify({ content: errorMessage });
				},
			},
		});
	},
	methods: {
		removeCurrentAvatar(): void
		{
			if (this.uploader)
			{
				this.uploader.removeFiles();
			}
			this.$emit('update', null);
		},
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
	`,
};
