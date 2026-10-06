import { BIcon } from 'ui.icon-set.api.vue';
import { IconSetMixin } from '../../mixins/icon-set-mixin';
import { LocMixin } from '../../mixins/loc-mixin';

import './system-user-badge.css';

const HelpArticleCode = 'redirect=detail&code=28659338';

// @vue/component
export const SystemUserBadge = {
	name: 'SystemUserBadge',
	components: {
		BIcon,
	},
	mixins: [
		LocMixin,
		IconSetMixin,
	],
	methods: {
		openHelp(): void
		{
			if (top.BX?.Helper)
			{
				top.BX.Helper.show(HelpArticleCode);
			}
		},
	},
	template: `
		<div
			class="intranet-user-mini-profile__system-user-badge"
			data-test-id="usermp_system_user"
			role="button"
			tabindex="0"
			@click="openHelp"
			@keydown.enter.prevent="openHelp"
			@keydown.space.prevent="openHelp"
		>
			<span class="intranet-user-mini-profile__system-user-badge_title">
				{{ loc('INTRANET_USER_MINI_PROFILE_ROLE_SYSTEM_USER') }}
			</span>
			<div
				class="intranet-user-mini-profile__system-user-badge_icon"
				data-test-id="usermp_system-user-title-icon"
			>
				<BIcon :name="outlineSet.INFO_CIRCLE" :size="16"/>
			</div>
		</div>
	`,
};
