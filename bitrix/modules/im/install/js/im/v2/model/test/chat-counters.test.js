import { Builder, type Store } from 'ui.vue3.vuex';

import { RecentType } from 'im.v2.const';
import { type ImModelCounter } from 'im.v2.model';
import 'im.v2.test';

import { CountersModel } from '../src/counters/counters';

describe('CountersModel', () => {
	let store: Store = null;

	const initStore = async () => {
		const builder = Builder.init().addModel(CountersModel.create());
		const { store: builtStore } = await builder.build();

		return builtStore;
	};

	beforeEach(async () => {
		store = await initStore();
	});

	describe('getters', () => {
		describe('getTotalCounterByRecentType', () => {
			it('should calculate total counter for default recent', async () => {
				const counters = [
					getCounterItem({ chatId: 1, counter: 5, recentSections: [RecentType.default] }),
					getCounterItem({ chatId: 2, counter: 3, recentSections: [RecentType.default] }),
					getCounterItem({ chatId: 3, counter: 10, recentSections: [RecentType.collab] }),
					getCounterItem({ chatId: 4, counter: 2, recentSections: [RecentType.default, RecentType.copilot] }),
				];

				await store.dispatch('counters/setCounters', counters);

				const counter = store.getters['counters/getTotalChatCounter'];
				assert.equal(counter, 10);
			});

			it('should calculate total counter for specific recent', async () => {
				const counters = [
					getCounterItem({ chatId: 1, counter: 5, recentSections: [RecentType.default] }),
					getCounterItem({ chatId: 3, counter: 10, recentSections: [RecentType.collab] }),
				];

				await store.dispatch('counters/setCounters', counters);

				const counter = store.getters['counters/getTotalCollabCounter'];
				assert.equal(counter, 10);
			});
		});

		describe('getTotalCounterByIds', () => {
			it('should calculate total counter for provided ids', async () => {
				const counters = [
					getCounterItem({ chatId: 1, counter: 5, recentSections: [RecentType.default] }),
					getCounterItem({ chatId: 2, counter: 6, recentSections: [RecentType.collab] }),
					getCounterItem({ chatId: 3, counter: 7, recentSections: [RecentType.copilot] }),
					getCounterItem({ chatId: 4, counter: 8, parentChatId: 1 }),
				];

				await store.dispatch('counters/setCounters', counters);

				const counter = store.getters['counters/getTotalCounterByIds']([1, 2, 3]);
				assert.equal(counter, 18);
			});
		});

		describe('getChildrenTotalCounter', () => {
			it('should calculate total counter of children chats for provided parentChatId', async () => {
				const counters = [
					getCounterItem({ chatId: 1, counter: 5, recentSections: [RecentType.default] }),
					getCounterItem({ chatId: 2, counter: 6, recentSections: [RecentType.collab] }),
					getCounterItem({ chatId: 3, counter: 7, parentChatId: 2 }),
					getCounterItem({ chatId: 4, counter: 8, parentChatId: 1 }),
					getCounterItem({ chatId: 5, counter: 9, parentChatId: 1 }),
				];

				await store.dispatch('counters/setCounters', counters);

				const counter = store.getters['counters/getChildrenTotalCounter'](1);
				assert.equal(counter, 17);
			});

			it('should return 0 for empty parentChatId', async () => {
				const counters = [
					getCounterItem({ chatId: 1, counter: 5, recentSections: [RecentType.default] }),
					getCounterItem({ chatId: 2, counter: 6, recentSections: [RecentType.collab] }),
					getCounterItem({ chatId: 3, counter: 7, parentChatId: 2 }),
					getCounterItem({ chatId: 4, counter: 8, parentChatId: 1 }),
					getCounterItem({ chatId: 5, counter: 9, parentChatId: 1 }),
				];

				await store.dispatch('counters/setCounters', counters);

				const counter = store.getters['counters/getChildrenTotalCounter'](0);
				assert.equal(counter, 0);
			});
		});

		describe('getChildrenIdsWithCounter', () => {
			it('should get ids of children chats with counter for provided parentChatId', async () => {
				const counters = [
					getCounterItem({ chatId: 1, counter: 5, recentSections: [RecentType.default] }),
					getCounterItem({ chatId: 2, counter: 6, recentSections: [RecentType.collab] }),
					getCounterItem({ chatId: 3, counter: 7, parentChatId: 2 }),
					getCounterItem({ chatId: 4, counter: 8, parentChatId: 1 }),
					getCounterItem({ chatId: 5, counter: 9, parentChatId: 1 }),
					getCounterItem({ chatId: 6, counter: 0, isMarkedAsUnread: true, parentChatId: 1 }),
				];

				await store.dispatch('counters/setCounters', counters);

				const ids = store.getters['counters/getChildrenIdsWithCounter'](1);
				assert.deepStrictEqual(ids, [4, 5]);
			});

			it('should return empty array for empty parentChatId', async () => {
				const counters = [
					getCounterItem({ chatId: 1, counter: 5, recentSections: [RecentType.default] }),
					getCounterItem({ chatId: 2, counter: 6, recentSections: [RecentType.collab] }),
					getCounterItem({ chatId: 3, counter: 7, parentChatId: 2 }),
					getCounterItem({ chatId: 4, counter: 8, parentChatId: 1 }),
					getCounterItem({ chatId: 5, counter: 9, parentChatId: 1 }),
					getCounterItem({ chatId: 6, counter: 0, isMarkedAsUnread: true, parentChatId: 1 }),
				];

				await store.dispatch('counters/setCounters', counters);

				const ids = store.getters['counters/getChildrenIdsWithCounter'](0);
				assert.deepStrictEqual(ids, []);
			});
		});

		describe('getCounterByChatId', () => {
			it('should get counter for provided chat id', async () => {
				const counters = [
					getCounterItem({ chatId: 1, counter: 5, recentSections: [RecentType.default] }),
					getCounterItem({ chatId: 2, counter: 6, recentSections: [RecentType.collab] }),
				];

				await store.dispatch('counters/setCounters', counters);

				const counter = store.getters['counters/getCounterByChatId'](2);
				assert.equal(counter, 6);
			});

			it('should return 0 if there is no entry for provided chat id', async () => {
				const counters = [
					getCounterItem({ chatId: 1, counter: 5, recentSections: [RecentType.default] }),
					getCounterItem({ chatId: 2, counter: 6, recentSections: [RecentType.collab] }),
				];

				await store.dispatch('counters/setCounters', counters);

				const counter = store.getters['counters/getCounterByChatId'](3);
				assert.equal(counter, 0);
			});
		});

		describe('getUnreadStatus', () => {
			it('should get unread status for provided chat id', async () => {
				const counters = [
					getCounterItem({ chatId: 1, isMarkedAsUnread: true, recentSections: [RecentType.default] }),
					getCounterItem({ chatId: 2, isMarkedAsUnread: false, recentSections: [RecentType.default] }),
				];

				await store.dispatch('counters/setCounters', counters);

				const withUnread = store.getters['counters/getUnreadStatus'](1);
				const withoutUnread = store.getters['counters/getUnreadStatus'](2);
				assert.equal(withUnread, true);
				assert.equal(withoutUnread, false);
			});

			it('should return false if there is no entry for provided chat id', async () => {
				const counters = [
					getCounterItem({ chatId: 1, isMarkedAsUnread: true, recentSections: [RecentType.default] }),
					getCounterItem({ chatId: 2, isMarkedAsUnread: false, recentSections: [RecentType.default] }),
				];

				await store.dispatch('counters/setCounters', counters);

				const status = store.getters['counters/getUnreadStatus'](3);
				assert.equal(status, false);
			});
		});
	});

	describe('actions', () => {
		describe('setCounters', () => {
			it('should save provided counters array as mapped objects', async () => {
				const firstChat = getCounterItem({
					chatId: 1,
					counter: 0,
					isMuted: false,
					isMarkedAsUnread: true,
					parentChatId: 0,
					recentSections: [RecentType.default],
				});
				const secondChat = getCounterItem({
					chatId: 2,
					counter: 1,
					isMuted: true,
					isMarkedAsUnread: false,
					parentChatId: 0,
					recentSections: [RecentType.default, RecentType.copilot],
				});
				const counters = [firstChat, secondChat];

				await store.dispatch('counters/setCounters', counters);

				const result = store.state.counters.collection;
				const expectedResult = {
					1: { ...firstChat },
					2: { ...secondChat },
				};
				assert.deepStrictEqual(result, expectedResult);
			});

			it('should handle only arrays', async () => {
				const firstChat = getCounterItem({
					chatId: 1,
					counter: 0,
					isMuted: false,
					isMarkedAsUnread: true,
					parentChatId: 0,
					recentSections: [RecentType.default],
				});

				await store.dispatch('counters/setCounters', firstChat);

				const result = store.state.counters.collection;
				assert.deepStrictEqual(result, {});
			});
		});
		describe('setCounter', () => {
			it('should set counter for provided chat id', async () => {
				const counters = [
					getCounterItem({ chatId: 1, counter: 5, recentSections: [RecentType.default] }),
					getCounterItem({ chatId: 2, counter: 6, recentSections: [RecentType.collab] }),
				];

				await store.dispatch('counters/setCounters', counters);
				await store.dispatch('counters/setCounter', {
					chatId: 1,
					counter: 9,
				});

				const counter = store.getters['counters/getCounterByChatId'](1);
				assert.equal(counter, 9);
			});

			it('should do nothing if there is no entry for provided chat id', async () => {
				const counters = [
					getCounterItem({ chatId: 1, counter: 5, recentSections: [RecentType.default] }),
					getCounterItem({ chatId: 2, counter: 6, recentSections: [RecentType.collab] }),
				];

				await store.dispatch('counters/setCounters', counters);
				await store.dispatch('counters/setCounter', {
					chatId: 3,
					counter: 9,
				});

				const counter = store.getters['counters/getCounterByChatId'](3);
				assert.equal(counter, 0);
			});
		});
		describe('setUnreadStatus', () => {
			it('should set unread status for provided chat id', async () => {
				const counters = [
					getCounterItem({ chatId: 1, counter: 5, recentSections: [RecentType.default] }),
					getCounterItem({ chatId: 2, counter: 6, recentSections: [RecentType.collab] }),
				];

				await store.dispatch('counters/setCounters', counters);
				await store.dispatch('counters/setUnreadStatus', {
					chatId: 1,
					status: true,
				});

				const status = store.getters['counters/getUnreadStatus'](1);
				assert.equal(status, true);
			});

			it('should do nothing if there is no entry for provided chat id', async () => {
				const counters = [
					getCounterItem({ chatId: 1, counter: 5, recentSections: [RecentType.default] }),
					getCounterItem({ chatId: 2, counter: 6, recentSections: [RecentType.collab] }),
				];

				await store.dispatch('counters/setCounters', counters);
				await store.dispatch('counters/setUnreadStatus', {
					chatId: 3,
					status: true,
				});

				const status = store.getters['counters/getUnreadStatus'](3);
				assert.equal(status, false);
			});
		});
		describe('setMuteStatus', () => {
			it('should set mute status for provided chat id', async () => {
				const counters = [
					getCounterItem({ chatId: 1, counter: 5, recentSections: [RecentType.default] }),
					getCounterItem({ chatId: 2, counter: 6, recentSections: [RecentType.collab] }),
				];

				await store.dispatch('counters/setCounters', counters);
				await store.dispatch('counters/setMuteStatus', {
					chatId: 1,
					status: true,
				});

				const collectionItem: ImModelCounter = store.state.counters.collection[1];
				const status = collectionItem.isMuted;
				assert.equal(status, true);
			});

			it('should do nothing if there is no entry for provided chat id', async () => {
				const counters = [
					getCounterItem({ chatId: 1, counter: 5, recentSections: [RecentType.default] }),
					getCounterItem({ chatId: 2, counter: 6, recentSections: [RecentType.collab] }),
				];

				await store.dispatch('counters/setCounters', counters);
				await store.dispatch('counters/setMuteStatus', {
					chatId: 3,
					counter: true,
				});

				const collectionItem: ImModelCounter = store.state.counters.collection[3];
				assert.equal(collectionItem, undefined);
			});
		});
		describe('clearByRecentType', () => {
			it('should clear all entries of provided recent type', async () => {
				const counters = [
					getCounterItem({ chatId: 1, counter: 5, recentSections: [RecentType.default] }),
					getCounterItem({ chatId: 2, counter: 6, recentSections: [RecentType.collab] }),
					getCounterItem({ chatId: 3, counter: 6, recentSections: [RecentType.default, RecentType.copilot] }),
				];

				await store.dispatch('counters/setCounters', counters);
				await store.dispatch('counters/clearByRecentType', { recentType: RecentType.default });

				const collectionLength: ImModelCounter = Object.values(store.state.counters.collection).length;
				assert.equal(collectionLength, 1);
			});

			it('should clear all children chats of provided recent type', async () => {
				const counters = [
					getCounterItem({ chatId: 1, counter: 5, recentSections: [RecentType.default] }),
					getCounterItem({ chatId: 2, counter: 6, recentSections: [RecentType.collab] }),
					getCounterItem({ chatId: 3, counter: 6, recentSections: [RecentType.default, RecentType.copilot] }),
					getCounterItem({ chatId: 4, parentChatId: 3 }),
					getCounterItem({ chatId: 5, parentChatId: 3 }),
					getCounterItem({ chatId: 6, parentChatId: 2 }),
				];

				await store.dispatch('counters/setCounters', counters);
				await store.dispatch('counters/clearByRecentType', { recentType: RecentType.default });

				const collectionLength: ImModelCounter = Object.values(store.state.counters.collection).length;
				assert.equal(collectionLength, 2);
			});
		});
		describe('clearById', () => {
			it('should clear entry by provided chat id', async () => {
				const counters = [
					getCounterItem({ chatId: 1, counter: 5, recentSections: [RecentType.default] }),
					getCounterItem({ chatId: 2, counter: 6, recentSections: [RecentType.collab] }),
					getCounterItem({ chatId: 3, counter: 6, recentSections: [RecentType.default, RecentType.copilot] }),
				];

				await store.dispatch('counters/setCounters', counters);
				await store.dispatch('counters/clearById', { chatId: 3 });
				await store.dispatch('counters/clearById', { chatId: 4 });

				const collectionLength: ImModelCounter = Object.values(store.state.counters.collection).length;
				assert.equal(collectionLength, 2);
			});

			it('should clear all children chats of provided chat id', async () => {
				const counters = [
					getCounterItem({ chatId: 1, counter: 5, recentSections: [RecentType.default] }),
					getCounterItem({ chatId: 2, counter: 6, recentSections: [RecentType.collab] }),
					getCounterItem({ chatId: 4, parentChatId: 1 }),
					getCounterItem({ chatId: 5, parentChatId: 1 }),
					getCounterItem({ chatId: 6, parentChatId: 2 }),
				];

				await store.dispatch('counters/setCounters', counters);
				await store.dispatch('counters/clearById', { chatId: 1 });

				const collectionLength: ImModelCounter = Object.values(store.state.counters.collection).length;
				assert.equal(collectionLength, 2);
			});
		});
		describe('clearByParentId', () => {
			it('should clear all children chats by provided parent chat id', async () => {
				const counters = [
					getCounterItem({ chatId: 1, counter: 5, recentSections: [RecentType.default] }),
					getCounterItem({ chatId: 2, counter: 6, recentSections: [RecentType.collab] }),
					getCounterItem({ chatId: 4, parentChatId: 1 }),
					getCounterItem({ chatId: 5, parentChatId: 1 }),
					getCounterItem({ chatId: 6, parentChatId: 2 }),
				];

				await store.dispatch('counters/setCounters', counters);
				await store.dispatch('counters/clearByParentId', { parentChatId: 1 });

				const collectionLength: ImModelCounter = Object.values(store.state.counters.collection).length;
				assert.equal(collectionLength, 3);
			});
		});
		describe('clear', () => {
			it('should clear all entries', async () => {
				const counters = [
					getCounterItem({ chatId: 1, counter: 5, recentSections: [RecentType.default] }),
					getCounterItem({ chatId: 2, counter: 6, recentSections: [RecentType.collab] }),
					getCounterItem({ chatId: 4, parentChatId: 1 }),
					getCounterItem({ chatId: 5, parentChatId: 1 }),
					getCounterItem({ chatId: 6, parentChatId: 2 }),
				];

				await store.dispatch('counters/setCounters', counters);
				await store.dispatch('counters/clear');

				const collectionLength: ImModelCounter = Object.values(store.state.counters.collection).length;
				assert.equal(collectionLength, 0);
			});
		});
	});

	describe('total counters', () => {
		it('should account for children chats for total counter', async () => {
			const counters = [
				getCounterItem({ chatId: 1, counter: 5, recentSections: [RecentType.default] }),
				getCounterItem({ chatId: 2, counter: 3, recentSections: [RecentType.default] }),
				getCounterItem({ chatId: 3, counter: 10, recentSections: [RecentType.collab] }),
				getCounterItem({ chatId: 4, counter: 2, recentSections: [RecentType.default, RecentType.copilot] }),
				getCounterItem({ chatId: 5, parentChatId: 2, counter: 4 }),
			];

			await store.dispatch('counters/setCounters', counters);

			const totalCounter = store.getters['counters/getTotalChatCounter'];
			assert.equal(totalCounter, 14);
		});

		it('should not account for muted chats for total counter', async () => {
			const counters = [
				getCounterItem({ chatId: 1, counter: 5, recentSections: [RecentType.default] }),
				getCounterItem({ chatId: 2, counter: 3, isMuted: true, recentSections: [RecentType.default] }),
				getCounterItem({ chatId: 3, counter: 4, isMuted: true, parentChatId: 1 }),
			];

			await store.dispatch('counters/setCounters', counters);

			const totalCounter = store.getters['counters/getTotalChatCounter'];
			assert.equal(totalCounter, 5);
		});

		it('should not account for children chats if parent is muted for total counter', async () => {
			const counters = [
				getCounterItem({ chatId: 1, counter: 5, recentSections: [RecentType.default] }),
				getCounterItem({ chatId: 2, counter: 3, isMuted: true, recentSections: [RecentType.default] }),
				getCounterItem({ chatId: 3, counter: 4, parentChatId: 2 }),
			];

			await store.dispatch('counters/setCounters', counters);

			const totalCounter = store.getters['counters/getTotalChatCounter'];
			assert.equal(totalCounter, 5);
		});

		it('should add 1 to total counter if there is no chat counter and chat is marked as unread', async () => {
			const counters = [
				getCounterItem({ chatId: 1, counter: 0, isMarkedAsUnread: true, recentSections: [RecentType.default] }),
				getCounterItem({ chatId: 2, counter: 3, recentSections: [RecentType.default] }),
			];

			await store.dispatch('counters/setCounters', counters);

			const totalCounter = store.getters['counters/getTotalChatCounter'];
			assert.equal(totalCounter, 4);
		});
	});
});

function getCounterItem(params: Partial<ImModelCounter> = {}): ImModelCounter
{
	return { ...CountersModel.prototype.getElementState(), ...params };
}
