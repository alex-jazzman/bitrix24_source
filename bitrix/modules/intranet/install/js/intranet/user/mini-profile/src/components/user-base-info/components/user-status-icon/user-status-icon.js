import { BIcon } from 'ui.icon-set.api.vue';

import { IconSetMixin } from '../../../../mixins/icon-set-mixin';
import { IconSettingByStatus } from './const';

import type { UserStatusIconSetting } from './const';

import './style.css';

// @vue/component
export const UserStatusIcon = {
	name: 'UserStatusIcon',
	components: {
		BIcon,
	},
	mixins: [IconSetMixin],
	props: {
		status: {
			/** @type UserStatusCodeType */
			type: String,
			default: 'offline',
		},
	},
	computed: {
		iconSetting(): UserStatusIconSetting | null
		{
			return IconSettingByStatus[this.status] ?? null;
		},
	},
	template: `
		<div v-if="iconSetting"
			class="intranet-user-mini-profile__user-status" 
			:style="{ '--ui-icon-set__icon-color': 'var(' + iconSetting.colorVar + ')' }"
		>
			<BIcon
				:size="24"
				:name="iconSetting.iconName"
			/>
		</div>
	`,
};
