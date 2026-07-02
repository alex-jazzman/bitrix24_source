import { Main } from 'ui.icon-set.api.core';
import { BIcon } from 'ui.icon-set.api.vue';

export const RolesDialogRoleItemAvatar = {
	name: 'RolesDialogRoleItemAvatar',
	components: {
		BIcon,
	},
	data(): { isAvatarLoaded: boolean | null } {
		return {
			isAvatarLoaded: null,
		};
	},
	props: {
		avatar: {
			type: String,
			required: false,
			default: null,
		},
		avatarAlt: {
			type: String,
			required: false,
			default: '',
		},
		icon: {
			type: String,
			required: false,
			default: null,
		},
		isUniversal: {
			type: Boolean,
			required: false,
			default: false,
		},
	},
	computed: {
		iconSize(): number {
			return 24;
		},
		iconColor(): string {
			return getComputedStyle(document.body).getPropertyValue('--ui-color-background-primary') || '#fff';
		},
		fallbackIcon(): string {
			return Main.COPILOT_AI;
		},
		wrapperClassName(): Object {
			return {
				'ai__roles-dialog_role-image-wrapper': true,
				'--universal': this.isUniversal,
			};
		},
	},
	methods: {
		onImageLoad(): void {
			this.isAvatarLoaded = true;
		},
		onImageLoadError(): void {
			this.isAvatarLoaded = false;
		},
	},
	template: `
		<div
			:class="wrapperClassName"
		>
			<div
				v-if="isUniversal"
			></div>
			<div
				v-else-if="icon"
				class="ai__roles-dialog_role-image-icon"
			>
				<BIcon
					:name="icon"
					:size="iconSize"
					:color="iconColor"
				/>
			</div>
			<div
				v-else
			>
				<transition name="ai-roles-dialog-icon-fade">
					<img
						v-show="isAvatarLoaded"
						class="ai__roles-dialog_role-image"
						:src="avatar"
						:alt="avatarAlt"
						@error="onImageLoadError"
						@load="onImageLoad"
					/>
				</transition>
				<div
					v-if="isAvatarLoaded === null || isAvatarLoaded === false"
					:class="{'ai__roles-dialog_role-image-icon': true, '--loading': isAvatarLoaded === null}"
				>
					<BIcon
						:name="fallbackIcon"
						:size="iconSize"
						:color="iconColor"
					/>
				</div>
			</div>
		</div>
	`,
};
