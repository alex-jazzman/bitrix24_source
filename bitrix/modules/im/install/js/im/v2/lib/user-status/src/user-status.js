import { Type } from 'main.core';
import { EventEmitter } from 'main.core.events';

import { Core } from 'im.v2.application.core';
import { EventType } from 'im.v2.const';
import { Utils } from 'im.v2.lib.utils';

import type { ImModelUser } from 'im.v2.model';

type UserId = number;

const DAY = 1000 * 60 * 60 * 24;

export class UserStatusManager
{
	static #instance: UserStatusManager;

	#absentList: Set<UserId> = new Set();
	#absentCheckTimeout: number | null = null;
	#absentCheckInterval: number | null = null;
	#birthdayLoadTimeout: number | null = null;
	#birthdayLoadInterval: number | null = null;

	static getInstance(): UserStatusManager
	{
		if (!this.#instance)
		{
			this.#instance = new this();
		}

		return this.#instance;
	}

	onUserUpdate(user: ImModelUser): void
	{
		this.#startBirthdayLoadInterval();

		if (user.birthday && Utils.user.isBirthdayToday(user.birthday))
		{
			this.#setUserBirthdayFlag(user.id, true);
			setTimeout(() => {
				this.#setUserBirthdayFlag(user.id, false);
			}, Utils.date.getTimeToNextMidnight());
		}

		if (Type.isDate(user.absent))
		{
			this.#setUserAbsentFlag(user.id, true);
			this.#startAbsentCheckInterval(user.id);
		}
		else if (user.absent === false && this.#absentList.has(user.id))
		{
			this.#setUserAbsentFlag(user.id, false);
			this.#stopAbsentCheckInterval(user.id);
		}
	}

	clear(): void
	{
		this.#absentList = new Set();
		clearTimeout(this.#absentCheckTimeout);
		clearInterval(this.#absentCheckInterval);
		this.#absentCheckTimeout = null;
		this.#absentCheckInterval = null;
		clearTimeout(this.#birthdayLoadTimeout);
		clearInterval(this.#birthdayLoadInterval);
		this.#birthdayLoadTimeout = null;
		this.#birthdayLoadInterval = null;
	}

	#setUserBirthdayFlag(userId: number, flag: boolean): void
	{
		Core.getStore().dispatch('users/update', {
			id: userId,
			fields: { isBirthday: flag },
		});
	}

	#setUserAbsentFlag(userId: number, flag: boolean): void
	{
		Core.getStore().dispatch('users/update', {
			id: userId,
			fields: { isAbsent: flag },
		});
	}

	#startAbsentCheckInterval(userId: number): void
	{
		this.#absentList.add(userId);
		if (this.#absentCheckTimeout || this.#absentCheckInterval)
		{
			return;
		}

		this.#absentCheckTimeout = setTimeout(() => {
			this.#absentCheckTimeout = null;
			this.#checkAbsentList();
			this.#absentCheckInterval = setInterval(() => {
				this.#checkAbsentList();
			}, DAY);
		}, Utils.date.getTimeToNextMidnight());
	}

	#stopAbsentCheckInterval(userId: number): void
	{
		this.#absentList.delete(userId);
	}

	#checkAbsentList()
	{
		for (const userId of this.#absentList)
		{
			const user: ImModelUser = Core.getStore().getters['users/get'](userId);
			if (!user || !Type.isDate(user.absent))
			{
				this.#stopAbsentCheckInterval(userId);

				return;
			}

			const absentEnd: Date = user.absent.getTime();
			if (absentEnd <= Date.now())
			{
				this.#setUserAbsentFlag(user.id, false);
				this.#stopAbsentCheckInterval(user.id);
			}
		}
	}

	/**
	 * Birthday marks belong to the day they were computed for. Which recent list is on screen the
	 * status library does not know, so it announces the new day and the list reloads itself.
	 */
	#emitDayChanged()
	{
		EventEmitter.emit(EventType.recent.dayChanged);
	}

	#startBirthdayLoadInterval()
	{
		if (this.#birthdayLoadTimeout || this.#birthdayLoadInterval)
		{
			return;
		}

		this.#birthdayLoadTimeout = setTimeout(() => {
			this.#birthdayLoadTimeout = null;
			this.#emitDayChanged();
			this.#birthdayLoadInterval = setInterval(() => {
				this.#emitDayChanged();
			}, DAY);
		}, Utils.date.getTimeToNextMidnight());
	}
}
