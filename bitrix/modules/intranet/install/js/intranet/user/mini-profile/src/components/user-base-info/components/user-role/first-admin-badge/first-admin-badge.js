import { BIcon } from 'ui.icon-set.api.vue';
import { hint, type HintParams } from 'ui.vue3.directives.hint';
import { getFirstAdminHintParams } from './first-admin-hint';
import { IconSetMixin } from '../../../../../mixins/icon-set-mixin';
import { LocMixin } from '../../../../../mixins/loc-mixin';

import './first-admin-badge.css';

// @vue/component
export const FirstAdminBadge = {
	name: 'FirstAdminBadge',
	directives: {
		hint,
	},
	components: {
		BIcon,
	},
	mixins: [
		LocMixin,
		IconSetMixin,
	],
	methods: {
		getHintParams(): HintParams
		{
			return getFirstAdminHintParams();
		},
	},
	template: `
		<div
			class="intranet-user-mini-profile__first-admin-badge"
			data-test-id="usermp_first_admin"
			v-hint="getHintParams"
		>
			<div
				class="intranet-user-mini-profile__first-admin-badge_icon"
				data-test-id="usermp_first-admin-title-icon"
			>
				<BIcon :name="solidSet.CROWN_1" :size="20"/>
			</div>
			<div class="intranet-user-mini-profile__first-admin-badge_title">
				{{ loc('INTRANET_USER_MINI_PROFILE_ROLE_FIRST_ADMIN') }}
			</div>
		</div>
	`,
};
