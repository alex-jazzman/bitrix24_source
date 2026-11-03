import { Core } from 'im.v2.application.core';
import { UserType } from 'im.v2.const';
import { type ImModelUser } from 'im.v2.model';

const getCurrentUser = (): ImModelUser | null => {
	return Core.getStore().getters['users/get'](Core.getUserId());
};

export const currentUserHasChannels = (): boolean => {
	return getCurrentUser()?.type === UserType.user;
};

export const isCurrentUserGuest = (): boolean => {
	return getCurrentUser()?.type === UserType.guest;
};
