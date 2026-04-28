import { Outline } from 'ui.icon-set.api.core';
import type { UserStatusType } from '../../../../type';

export const IconSettingByStatus: Record<UserStatusType, UserStatusIconSetting> = {
	vacation: {
		iconName: Outline.EARTH_WITH_TREE,
		colorVar: '--ui-color-accent-extra-aqua',
	},
};

export type UserStatusIconSetting = {
	iconName: string,
	colorVar: string,
};
