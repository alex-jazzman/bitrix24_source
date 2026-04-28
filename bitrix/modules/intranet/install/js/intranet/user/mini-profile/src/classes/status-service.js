import type { UserStatusCodeType } from '../type';
import { UserStatus, UserStatusToShow } from '../type';

export class StatusService
{
	static isSupportedToShow(statusCode: ?string): boolean
	{
		return Object.values(UserStatusToShow).includes(statusCode);
	}

	static isSupported(statusCode: ?string): boolean
	{
		return Object.values(UserStatus).includes(statusCode);
	}

	static getFailoverStatus(): UserStatusCodeType
	{
		return UserStatus.Offline;
	}
}
