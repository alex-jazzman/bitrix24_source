import { ajax } from 'main.core';

import UserSharing from './user-sharing';
import { User } from '../../model';

type UserSharingConfig = {
	link: {
		url: string,
		hash: string,
		rule: Object,
	},
	userCalendarSettings: {
		week_holidays: string,
		week_start: string,
		work_time_start: string,
		work_time_end: string,
	},
	user: User,
}

export default class UserSharingController
{
	static #userSharing: UserSharing = null;
	static #userId: number = null;
	static #bindElement: HTMLElement = null;
	static #config = null;

	static async getUserSharing(userId: number, bindElement: ?HTMLElement): Promise<UserSharing>
	{
		if (
			UserSharingController.#userSharing
			&& UserSharingController.#userId === userId
			&& (UserSharingController.#bindElement === bindElement || !bindElement)
		)
		{
			return UserSharingController.#userSharing;
		}

		const config = await this.#getSharingConfig(userId);

		UserSharingController.#userSharing = new UserSharing({
			bindElement,
			context: 'calendar',
			userInfo: {
				id: config.user.id,
				name: config.user.name,
				avatar: config.user.avatar,
			},
			sharingConfig: config.link,
			calendarSettings: config.userCalendarSettings,
		});

		UserSharingController.#config = config;
		UserSharingController.#userId = userId;
		UserSharingController.#bindElement = bindElement;

		return this.#userSharing;
	}

	static async #getSharingConfig(userId: number): Promise<UserSharingConfig>
	{
		if (
			this.#userId === userId
			&& this.#config
		)
		{
			return Promise.resolve(this.#config);
		}

		return this.#requestSharingConfig(userId);
	}

	static async #requestSharingConfig(userId: number): Promise<UserSharingConfig>
	{
		const response = await ajax.runAction(
			'calendar.api.sharingajax.enableAndGetSharingConfig',
			{ data: { userId } },
		);

		return response.data;
	}
}
