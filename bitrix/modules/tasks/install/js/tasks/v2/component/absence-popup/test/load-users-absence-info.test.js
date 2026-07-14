import 'tasks.v2.test';

import { Core } from 'tasks.v2.core';
import { Model } from 'tasks.v2.const';
import { absenceService } from 'tasks.v2.provider.service.absence-service';

import { loadUsersAbsenceInfo } from '../src/lib/load-users-absence-info';

function createItem(id, isOnVacation)
{
	return {
		getId: () => id,
		customData: {
			get: (key) => (key === 'isOnVacation' ? isOnVacation : undefined),
		},
	};
}

describe('loadUsersAbsenceInfo', () => {
	let originalGetStore;
	let originalGetUsersAbsenceInfo;
	let dispatchedFetching;
	let requestedUserIds;

	const currentUserId = 1;

	beforeEach(() => {
		originalGetStore = Core.getStore;
		originalGetUsersAbsenceInfo = absenceService.getUsersAbsenceInfo;

		dispatchedFetching = [];
		requestedUserIds = null;

		Core.getStore = () => ({
			getters: {
				[`${Model.Interface}/currentUserId`]: currentUserId,
			},
			dispatch: (action, payload) => {
				if (action === `${Model.Absences}/setFetching`)
				{
					dispatchedFetching.push(payload);
				}

				return Promise.resolve();
			},
		});

		absenceService.getUsersAbsenceInfo = (userIds) => {
			requestedUserIds = userIds;

			return Promise.resolve();
		};
	});

	afterEach(() => {
		Core.getStore = originalGetStore;
		absenceService.getUsersAbsenceInfo = originalGetUsersAbsenceInfo;
	});

	it('returns ids of users on vacation, excluding current user', async () => {
		const items = [
			createItem(10, true),
			createItem(20, true),
			createItem(30, false),
			createItem(currentUserId, true),
		];

		const result = await loadUsersAbsenceInfo(items);

		assert.deepEqual(result, [10, 20]);
		assert.deepEqual(requestedUserIds, [10, 20]);
	});

	it('toggles fetching around the request when there are absent users', async () => {
		await loadUsersAbsenceInfo([createItem(10, true)]);

		assert.deepEqual(dispatchedFetching, [true, false]);
	});

	it('returns empty array and skips request when nobody is on vacation', async () => {
		const result = await loadUsersAbsenceInfo([createItem(10, false)]);

		assert.deepEqual(result, []);
		assert.isNull(requestedUserIds, 'absence service must not be called');
		assert.deepEqual(dispatchedFetching, [], 'fetching must not be toggled');
	});

	it('returns empty array for no items', async () => {
		const result = await loadUsersAbsenceInfo();

		assert.deepEqual(result, []);
	});
});
