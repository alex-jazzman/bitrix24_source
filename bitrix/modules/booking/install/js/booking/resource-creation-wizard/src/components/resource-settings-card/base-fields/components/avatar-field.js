import { BaseEvent } from 'main.core.events';
import { Uploader, UploaderEvent } from 'ui.uploader.core';
import { RichLoc } from 'ui.vue3.components.rich-loc';
import { BIcon, Set as IconSet } from 'ui.icon-set.api.vue';
import 'ui.notification';

import '../css/avatar-field.css';

// @vue/component
export const AvatarField = {
	name: 'ResourceAvatarField',
	components: { RichLoc, BIcon },
	props: {
		avatarUrl: {
			type: String,
			default: '',
		},
	},
	emits: [
		'avatarFileUpdate',
	],
	setup(): { IconSet: IconSet }
	{
		return {
			IconSet,
		};
	},
	computed: {
		hasAvatar(): boolean
		{
			return this.avatarUrl.trim().length > 0;
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
					this.$emit('avatarFileUpdate', file);
				},
				[UploaderEvent.FILE_ERROR]: (event: BaseEvent): void => {
					const error = event.getData().error;
					const errorMessage = error.getMessage();

					BX.UI.Notification.Center.notify({ content: errorMessage });
				},
			},
		});
	},
	methods: {
		removeCurrentAvatar(): void
		{
			this.uploader.removeFiles();
			this.$emit('avatarFileUpdate', null);
		},
	},
	template: `
		<div class="ui-form-row booking--rcw--avatar-field">
			<div class="ui-form-label">
				{{ loc('BRCW_SETTINGS_CARD_AVATAR_UPLOAD_LABEL') }}
			</div>
			<div class="booking--rcw--avatar-container">
				<div
					class="booking--rcw--avatar"
					:class="{ '--has-img': hasAvatar }"
					data-id="brcw-settings-resource-avatar-input"
					ref="uploaderContainer"
				>
					<img
						v-if="hasAvatar"
						class="booking--rcw--avatar-img"
						:src="avatarUrl"
						alt="Resource avatar"
						draggable="false"
					/>
					<span v-else class="booking--rcw--avatar-icon --default-icon">
						<BIcon :name="IconSet.PICTURE" :size="36"></BIcon>
					</span>
					<span class="booking--rcw--avatar-icon --hover-icon">
						<BIcon :name="IconSet.DOWNLOAD_3" :size="29"></BIcon>
					</span>
				</div>
				<span v-if="hasAvatar" class="booking--rcw--avatar-remove" @click="removeCurrentAvatar">
					<BIcon :name="IconSet.CROSS_25" :size="14"></BIcon>
				</span>
			</div>
		</div>
	`,
};
