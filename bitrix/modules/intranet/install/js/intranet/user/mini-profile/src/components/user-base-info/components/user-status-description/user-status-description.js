import { DateTimeFormat } from 'main.date';
import { Type } from 'main.core';

import { LocMixin } from '../../../../mixins/loc-mixin';
import { StaticDescriptionByStatus } from './const';
import { UserStatus } from '../../../../type';

import type { UserStatusType } from '../../../../type';

import './style.css';

// @vue/component
export const UserStatusDescription = {
	name: 'UserStatusDescription',
	mixins: [LocMixin],
	props: {
		status: {
			/** @type UserStatusType */
			type: Object,
			required: true,
		},
	},
	computed: {
		text(): string
		{
			const staticText = StaticDescriptionByStatus[this.status.code] ?? null;
			if (staticText)
			{
				return staticText;
			}

			if (this.status.code === UserStatus.Offline)
			{
				return this.formatTextForOfflineStatus(this.status);
			}

			if (this.status.code === UserStatus.Vacation)
			{
				return this.formatTextForVacationStatus(this.status);
			}

			return '';
		},
	},
	methods: {
		formatTextForOfflineStatus(status: UserStatusType): string
		{
			if (!Type.isNumber(status.lastSeenTs) || status.lastSeenTs === 0)
			{
				return this.loc('INTRANET_USER_MINI_PROFILE_USER_STATUS_OFFLINE');
			}

			const dayMonthFormat = DateTimeFormat.getFormat('DAY_MONTH_FORMAT');
			const shortTimeFormat = DateTimeFormat.getFormat('SHORT_TIME_FORMAT');

			return this.loc('INTRANET_USER_MINI_PROFILE_USER_STATUS_OFFLINE_LAST_SEEN_TEMPLATE', {
				'#DATE#': DateTimeFormat.format(dayMonthFormat, status.lastSeenTs),
				'#TIME#': DateTimeFormat.format(shortTimeFormat, status.lastSeenTs),
			});
		},
		formatTextForVacationStatus(status: UserStatusType): string
		{
			if (!Type.isNumber(status.vacationTs))
			{
				return this.loc('INTRANET_USER_MINI_PROFILE_USER_STATUS_VACATION');
			}

			const dayMonthFormat = DateTimeFormat.getFormat('DAY_MONTH_FORMAT');

			return this.loc('INTRANET_USER_MINI_PROFILE_USER_STATUS_VACATION_TEMPLATE', {
				'#DATE#': DateTimeFormat.format(dayMonthFormat, status.vacationTs),
			});
		},
	},
	template: `
		<span v-if="text"
			class="intranet-user-mini-profile__user-status-description"
		>
			{{ text }}
		</span>
	`,
};
