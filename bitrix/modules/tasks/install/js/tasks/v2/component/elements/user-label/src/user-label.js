import { BCircle, BLine } from 'ui.system.skeleton.vue';
import 'ui.tooltip';

import { UserAvatar } from 'tasks.v2.component.elements.user-avatar';

import './user-label.css';

// @vue/component
export const UserLabel = {
	name: 'UiUserLabel',
	components: {
		UserAvatar,
		BCircle,
		BLine,
	},
	props: {
		/** @type UserModel */
		user: {
			type: Object,
			required: true,
		},
		avatarOnly: {
			type: Boolean,
			default: false,
		},
	},
	template: `
		<div v-if="user" class="b24-user-label" :bx-tooltip-user-id="user.id" bx-tooltip-context="b24">
			<UserAvatar
				:src="user.image ?? ''"
				:type="user.type"
				:borderColor="avatarOnly ? 'var(--ui-color-background-primary)' : undefined"
			/>
			<div v-if="!avatarOnly" :class="['b24-user-label-name', '--' + user.type]">{{ user.name }}</div>
		</div>
		<div v-else style="display: flex;align-items: center;min-height: 22px;">
			<BCircle :size="22"/>
			<BLine v-if="!avatarOnly" :width="130" :height="12" style="margin-left: 8px"/>
		</div>
	`,
};
