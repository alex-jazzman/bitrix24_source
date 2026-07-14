import { RawUser } from '../../base/types/common';

declare type UserShowInRecentParams = {
	items: UserShowInRecentItem[],
};

type UserShowInRecentItem = {
	user: RawUser,
	date: string,
};