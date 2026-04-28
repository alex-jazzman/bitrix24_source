import { Builder, type Store } from 'ui.vue3.vuex';

import { Core } from 'im.v2.application.core';
import { RecentType } from 'im.v2.const';
import { type ImModelRecentItem } from 'im.v2.model';
import 'im.v2.test';

import { RecentModel } from '../src/recent/recent';
import { MessagesModel } from '../src/messages/messages';
import { ChatsModel } from '../src/chats/chats';

describe('RecentModel', () => {
	let store: Store = null;

	const initStore = async () => {
		const builder = Builder.init()
			.addModel(RecentModel.create())
			.addModel(MessagesModel.create())
			.addModel(ChatsModel.create());
		const { store: builtStore } = await builder.build();

		return builtStore;
	};

	before(() => {
		sinon.stub(Core, 'getStore').callsFake(() => store);
	});

	beforeEach(async () => {
		store = await initStore();
	});

	after(() => {
		sinon.restore();
	});

	describe('getters', () => {
		describe('getCollection', () => {
			it('should get items list by provided type', async () => {
				const chat1 = { dialogId: 'chat1' };
				const chat2 = { dialogId: 'chat2' };

				await store.dispatch('chats/set', [chat1, chat2]);

				const recentItem1 = getRecentItem({ dialogId: chat1.dialogId });
				const recentItem2 = getRecentItem({ dialogId: chat2.dialogId });

				await store.dispatch('recent/setCollection', {
					items: [recentItem1, recentItem2],
					type: RecentType.default,
				});

				const result = store.getters['recent/getCollection']({
					type: RecentType.default,
				});

				assert.equal(result.length, 2);
				assert.equal(result[0].dialogId, recentItem1.dialogId);
				assert.equal(result[1].dialogId, recentItem2.dialogId);
			});
			it('should get items list by provided type and parentChatId', async () => {
				const chat1 = { dialogId: 'chat1' };
				const chat2 = { dialogId: 'chat2' };

				await store.dispatch('chats/set', [chat1, chat2]);

				const recentItem1 = getRecentItem({ dialogId: chat1.dialogId });
				const recentItem2 = getRecentItem({ dialogId: chat2.dialogId });

				const parentChatId = 2;
				await store.dispatch('recent/setCollection', {
					items: [recentItem1, recentItem2],
					type: RecentType.default,
					parentChatId,
				});

				const result = store.getters['recent/getCollection']({
					type: RecentType.default,
					parentChatId,
				});

				assert.equal(result.length, 2);
				assert.equal(result[0].dialogId, recentItem1.dialogId);
				assert.equal(result[1].dialogId, recentItem2.dialogId);
			});
			it('should return empty list if there is no such type', async () => {
				const chat = { dialogId: 'chat1' };

				await store.dispatch('chats/set', [chat]);

				const recentItem1 = getRecentItem({ dialogId: chat.dialogId });

				const parentChatId = 2;
				await store.dispatch('recent/setCollection', {
					items: [recentItem1],
					type: RecentType.default,
					parentChatId,
				});

				const result = store.getters['recent/getCollection']({
					type: RecentType.copilot,
					parentChatId,
				});

				assert.equal(result.length, 0);
			});
			it('should return empty list if there is no such parent', async () => {
				const result = store.getters['recent/getCollection']({
					type: RecentType.default,
					parentChatId: 99,
				});

				assert.equal(result.length, 0);
			});
			it('should ignore items if there is no matching chat object for them', async () => {
				const chat = { dialogId: 'chat1' };

				await store.dispatch('chats/set', [chat]);

				const recentItem1 = getRecentItem({ dialogId: chat.dialogId });
				const recentItem2 = getRecentItem({ dialogId: 'chat2' });

				await store.dispatch('recent/setCollection', {
					items: [recentItem1, recentItem2],
					type: RecentType.default,
				});

				const result = store.getters['recent/getCollection']({
					type: RecentType.default,
				});

				assert.equal(result.length, 1);
				assert.equal(result[0].dialogId, recentItem1.dialogId);
			});
			it('should ignore items if there is no matching recent object for them', async () => {
				const chat1 = { dialogId: 'chat1' };
				const chat2 = { dialogId: 'chat2' };

				await store.dispatch('chats/set', [chat1, chat2]);

				const recentItem1 = getRecentItem({ dialogId: chat1.dialogId });
				const recentItem2 = getRecentItem({ dialogId: chat2.dialogId });

				await store.dispatch('recent/setCollection', {
					items: [recentItem1, recentItem2],
					type: RecentType.default,
				});

				await store.dispatch('recent/delete', {
					dialogId: chat1.dialogId,
				});

				const result = store.getters['recent/getCollection']({
					type: RecentType.default,
				});

				assert.equal(result.length, 1);
				assert.equal(result[0].dialogId, recentItem2.dialogId);
			});
		});
		describe('getUnreadCollection', () => {
			it('should be a proxy call for getCollection with unread flag', async () => {
				const chat1 = { dialogId: 'chat1' };
				const chat2 = { dialogId: 'chat2' };

				await store.dispatch('chats/set', [chat1, chat2]);

				const recentItem1 = getRecentItem({ dialogId: chat1.dialogId });
				const recentItem2 = getRecentItem({ dialogId: chat2.dialogId });

				await store.dispatch('recent/setUnreadCollection', {
					items: [recentItem1, recentItem2],
					type: RecentType.default,
				});

				const result = store.getters['recent/getUnreadCollection']({
					type: RecentType.default,
				});

				assert.equal(result.length, 2);
				assert.equal(result[0].dialogId, recentItem1.dialogId);
				assert.equal(result[1].dialogId, recentItem2.dialogId);
			});
		});
		describe('getSortedCollection', () => {
			it('should get sorted list of items by provided type', async () => {
				const chat1 = { dialogId: 'chat1' };
				const chat2 = { dialogId: 'chat2' };
				await store.dispatch('chats/set', [chat1, chat2]);

				const message1 = { id: 1, date: new Date('2026-01-01') };
				const message2 = { id: 2, date: new Date('2026-01-02') };
				await store.dispatch('messages/store', [message1, message2]);

				const recentItem1 = getRecentItem({ dialogId: chat1.dialogId, messageId: message1.id });
				const recentItem2 = getRecentItem({ dialogId: chat2.dialogId, messageId: message2.id });

				await store.dispatch('recent/setCollection', {
					items: [recentItem1, recentItem2],
					type: RecentType.default,
				});

				const sortedResult = store.getters['recent/getSortedCollection']({
					type: RecentType.default,
				});

				assert.equal(sortedResult.length, 2);
				assert.equal(sortedResult[0].dialogId, chat2.dialogId);
				assert.equal(sortedResult[1].dialogId, chat1.dialogId);
			});
			it('should handle items with missing messages', async () => {
				const chat = { dialogId: 'chat1' };
				await store.dispatch('chats/set', [chat]);

				const recentItem = getRecentItem({ dialogId: chat.dialogId, messageId: 999 });

				await store.dispatch('recent/setCollection', {
					items: [recentItem],
					type: RecentType.default,
				});

				const sorted = store.getters['recent/getSortedCollection']({
					type: RecentType.default,
				});

				assert.equal(sorted.length, 1);
				assert.equal(sorted[0].dialogId, chat.dialogId);
			});
		});
		describe('get', () => {
			it('should return recent item by provided dialogId', async () => {
				const recentItem = getRecentItem({ dialogId: 'chat1' });
				await store.dispatch('recent/set', recentItem);

				const result = store.getters['recent/get'](recentItem.dialogId);

				assert.deepStrictEqual(result, recentItem);
			});

			it('should return null if item with provided dialogId does not exist', async () => {
				const result = store.getters['recent/get'](99);

				assert.equal(result, null);
			});
		});
		describe('getMessage', () => {
			it('should return message object for provided dialogId', async () => {
				const message = { id: 1, text: 'message' };
				await store.dispatch('messages/store', message);

				const recentItem = getRecentItem({ dialogId: 'chat1', messageId: message.id });
				await store.dispatch('recent/set', recentItem);

				const result = store.getters['recent/getMessage'](recentItem.dialogId);

				assert.equal(result.id, message.id);
				assert.equal(result.text, message.text);
			});

			it('should return null if recent item with provided dialogId does not exist', async () => {
				const result = store.getters['recent/getMessage'](99);

				assert.equal(result, null);
			});

			it('should return undefined if message does not exist', async () => {
				const recentItem = getRecentItem({ dialogId: 'chat1', messageId: 1 });
				await store.dispatch('recent/set', recentItem);

				const result = store.getters['recent/getMessage'](recentItem.dialogId);

				assert.equal(result, undefined);
			});
		});
		describe('hasInCollection', () => {
			it('should return true if item exists in collection with provided type', async () => {
				const recentItem = getRecentItem({ dialogId: 'chat1' });

				await store.dispatch('recent/setCollection', {
					items: [recentItem],
					type: RecentType.default,
				});

				const result = store.getters['recent/hasInCollection']({
					dialogId: recentItem.dialogId,
					type: RecentType.default,
				});

				assert.equal(result, true);
			});

			it('should return false if item exists in collection with different type', async () => {
				const recentItem = getRecentItem({ dialogId: 'chat1' });

				await store.dispatch('recent/setCollection', {
					items: [recentItem],
					type: RecentType.collab,
				});

				const result = store.getters['recent/hasInCollection']({
					dialogId: recentItem.dialogId,
					type: RecentType.default,
				});

				assert.equal(result, false);
			});

			it('should return false if item does not exist', async () => {
				const result = store.getters['recent/hasInCollection']({
					dialogId: 'chat1',
					type: RecentType.default,
				});

				assert.equal(result, false);
			});
		});
	});

	describe('actions', () => {
		describe('setCollection', () => {
			it('should set index for provided items', async () => {
				const recentItem1 = getRecentItem({ dialogId: 'chat1' });
				const recentItem2 = getRecentItem({ dialogId: 'chat2' });

				await store.dispatch('recent/setCollection', {
					items: [recentItem1],
					type: RecentType.default,
				});

				await store.dispatch('recent/setCollection', {
					items: [recentItem2],
					type: RecentType.taskComments,
				});

				const { recentIndex } = store.state.recent;
				const defaultIdSet = recentIndex[RecentModel.ROOT_PARENT_ID][RecentType.default];
				const tasksIdSet = recentIndex[RecentModel.ROOT_PARENT_ID][RecentType.taskComments];

				assert.equal(defaultIdSet.has(recentItem1.dialogId), true);
				assert.equal(tasksIdSet.has(recentItem2.dialogId), true);
			});
			it('should set index for provided items with parentChatId', async () => {
				const recentItem = getRecentItem({ dialogId: 'chat1' });

				const parentChatId = 2;
				await store.dispatch('recent/setCollection', {
					items: [recentItem],
					type: RecentType.default,
					parentChatId,
				});

				const { recentIndex } = store.state.recent;
				const idSet = recentIndex[parentChatId][RecentType.default];

				assert.equal(idSet.has(recentItem.dialogId), true);
			});
		});
		describe('setUnreadCollection', () => {
			it('should be a proxy for a setCollection call with unread flag', async () => {
				const recentItem = getRecentItem({ dialogId: 'chat1' });

				await store.dispatch('recent/setUnreadCollection', {
					items: [recentItem],
					type: RecentType.default,
				});

				const { unreadIndex } = store.state.recent;
				const idSet = unreadIndex[RecentModel.ROOT_PARENT_ID][RecentType.default];

				assert.equal(idSet.has(recentItem.dialogId), true);
			});
		});
		describe('clearCollection', () => {
			it('should clear collection by provided type', async () => {
				const recentItem = getRecentItem({ dialogId: 'chat1' });

				await store.dispatch('recent/setCollection', {
					items: [recentItem],
					type: RecentType.default,
				});

				await store.dispatch('recent/clearCollection', {
					type: RecentType.default,
				});

				const { recentIndex } = store.state.recent;
				const idSet = recentIndex[RecentModel.ROOT_PARENT_ID][RecentType.default];

				assert.equal(Boolean(idSet), false);
			});
			it('should clear collection by provided type and parentChatId', async () => {
				const recentItem = getRecentItem({ dialogId: 'chat1' });

				const parentChatId = 2;
				await store.dispatch('recent/setCollection', {
					items: [recentItem],
					type: RecentType.default,
					parentChatId,
				});

				await store.dispatch('recent/clearCollection', {
					type: RecentType.default,
					parentChatId,
				});

				const { recentIndex } = store.state.recent;
				const idSet = recentIndex[parentChatId][RecentType.default];

				assert.equal(Boolean(idSet), false);
			});
		});
		describe('clearUnreadCollection', () => {
			it('should be a proxy for a clearCollection call with unread flag', async () => {
				const recentItem = getRecentItem({ dialogId: 'chat1' });

				await store.dispatch('recent/setUnreadCollection', {
					items: [recentItem],
					type: RecentType.default,
				});

				await store.dispatch('recent/clearUnreadCollection', {
					type: RecentType.default,
				});

				const { unreadIndex } = store.state.recent;
				const idSet = unreadIndex[RecentModel.ROOT_PARENT_ID][RecentType.default];

				assert.equal(Boolean(idSet), false);
			});
		});
		describe('store', () => {
			it('should store provided items', async () => {
				const recentItem1 = getRecentItem({ dialogId: 'chat1' });
				const recentItem2 = getRecentItem({ dialogId: 'chat2' });

				await store.dispatch('recent/set', [recentItem1, recentItem2]);

				const { collection } = store.state.recent;

				assert.equal(Boolean(collection[recentItem1.dialogId]), true);
				assert.equal(Boolean(collection[recentItem1.dialogId]), true);
			});
			it('should return ids of processed items', async () => {
				const recentItem1 = getRecentItem({ dialogId: 'chat1' });
				const recentItem2 = getRecentItem({ dialogId: 'chat2' });

				const result = await store.dispatch('recent/set', [recentItem1, recentItem2]);

				assert.deepStrictEqual(result, [recentItem1.dialogId, recentItem2.dialogId]);
			});
			it('should update existing items', async () => {
				const recentItem = getRecentItem({ dialogId: 'chat1' });

				await store.dispatch('recent/set', recentItem);

				const collection = store.state.recent.collection;

				const storeItem: ImModelRecentItem = collection[recentItem.dialogId];
				assert.equal(storeItem.messageId, recentItem.messageId);

				const updatedRecentItem = { ...recentItem, messageId: 5 };

				await store.dispatch('recent/set', updatedRecentItem);

				const updatedStoreItem: ImModelRecentItem = collection[recentItem.dialogId];
				assert.equal(updatedStoreItem.messageId, updatedRecentItem.messageId);
			});
		});
		describe('update', () => {
			it('should update item by dialogId with provided fields', async () => {
				const recentItem = getRecentItem({ dialogId: 'chat1' });

				await store.dispatch('recent/set', recentItem);

				const collection = store.state.recent.collection;

				const storeItem: ImModelRecentItem = collection[recentItem.dialogId];
				assert.equal(storeItem.messageId, recentItem.messageId);

				const updateFields = { messageId: 5 };

				await store.dispatch('recent/update', {
					dialogId: recentItem.dialogId,
					fields: updateFields,
				});

				const updatedStoreItem: ImModelRecentItem = collection[recentItem.dialogId];
				assert.equal(updatedStoreItem.messageId, updateFields.messageId);
			});
		});
		describe('pin', () => {
			it('should set pin status for provided dialogId item', async () => {
				const recentItem = getRecentItem({ dialogId: 'chat1' });

				await store.dispatch('recent/set', recentItem);

				const collection = store.state.recent.collection;

				const storeItem: ImModelRecentItem = collection[recentItem.dialogId];
				assert.equal(storeItem.pinned, recentItem.pinned);

				await store.dispatch('recent/pin', {
					dialogId: recentItem.dialogId,
					action: true,
				});

				const updatedStoreItem: ImModelRecentItem = collection[recentItem.dialogId];
				assert.equal(updatedStoreItem.pinned, true);
			});
		});
		describe('like', () => {
			it('should set liked status for provided dialogId item', async () => {
				const recentItem = getRecentItem({ dialogId: 'chat1', messageId: 1 });

				await store.dispatch('recent/set', recentItem);

				const collection = store.state.recent.collection;

				const storeItem: ImModelRecentItem = collection[recentItem.dialogId];
				assert.equal(storeItem.liked, recentItem.liked);

				await store.dispatch('recent/like', {
					dialogId: recentItem.dialogId,
					messageId: 1,
					liked: true,
				});

				const updatedStoreItem: ImModelRecentItem = collection[recentItem.dialogId];
				assert.equal(updatedStoreItem.liked, true);
			});
			it('should not change liked status if provided messageId is not current last message', async () => {
				const recentItem = getRecentItem({ dialogId: 'chat1', messageId: 2 });

				await store.dispatch('recent/set', recentItem);

				const collection = store.state.recent.collection;

				const storeItem: ImModelRecentItem = collection[recentItem.dialogId];
				assert.equal(storeItem.liked, recentItem.liked);

				await store.dispatch('recent/like', {
					dialogId: recentItem.dialogId,
					messageId: 1,
					liked: true,
				});

				const updatedStoreItem: ImModelRecentItem = collection[recentItem.dialogId];
				assert.equal(updatedStoreItem.liked, recentItem.liked);
			});
		});
		describe('setDraft', () => {
			it('should set draft text for provided dialogId item', async () => {
				const recentItem = getRecentItem({ dialogId: 'chat1' });

				await store.dispatch('recent/set', recentItem);

				const collection = store.state.recent.collection;

				const storeItem: ImModelRecentItem = collection[recentItem.dialogId];
				assert.deepStrictEqual(storeItem.draft, recentItem.draft);

				const draftText = 'draft';
				await store.dispatch('recent/setDraft', {
					dialogId: recentItem.dialogId,
					text: draftText,
				});

				const updatedStoreItem: ImModelRecentItem = collection[recentItem.dialogId];
				assert.equal(updatedStoreItem.draft.text, draftText);
			});
			it('should add fake recent item with draft if there is no current item', async () => {
				const payload = {
					dialogId: 'chat1',
					text: 'draft',
				};
				await store.dispatch('recent/setDraft', payload);

				const { collection, recentIndex } = store.state.recent;

				const storeItem: ImModelRecentItem = collection[payload.dialogId];
				assert.equal(storeItem.draft.text, payload.text);

				const recentIdSet = recentIndex[RecentModel.ROOT_PARENT_ID][RecentType.default];
				assert.equal(recentIdSet.has(payload.dialogId), true);
			});
			it('should not add fake recent item with draft if addFakeItems parameter is false', async () => {
				const payload = {
					dialogId: 'chat1',
					text: 'draft',
					addFakeItems: false,
				};
				await store.dispatch('recent/setDraft', payload);

				const { collection, recentIndex } = store.state.recent;

				const storeItem: ImModelRecentItem = collection[payload.dialogId];
				assert.equal(Boolean(storeItem), false);

				const recentIdSet = recentIndex[RecentModel.ROOT_PARENT_ID]?.[RecentType.default];
				assert.equal(Boolean(recentIdSet), false);
			});
			it('should remove fake recent item with draft if we provide empty text', async () => {
				const draftPayload = {
					dialogId: 'chat1',
					text: 'draft',
				};
				await store.dispatch('recent/setDraft', draftPayload);

				const { collection, recentIndex } = store.state.recent;

				const storeItem: ImModelRecentItem = collection[draftPayload.dialogId];
				assert.equal(storeItem.draft.text, draftPayload.text);

				const clearDraftPayload = {
					dialogId: 'chat1',
					text: '',
				};
				await store.dispatch('recent/setDraft', clearDraftPayload);

				const recentIdSet = recentIndex[RecentModel.ROOT_PARENT_ID][RecentType.default];
				assert.equal(recentIdSet.has(clearDraftPayload.dialogId), false);
			});
		});
		describe('hide', () => {
			it('should remove item with provided dialogId from all collections', async () => {
				const recentItem = getRecentItem({ dialogId: 'chat1' });

				await store.dispatch('recent/setCollection', {
					items: [recentItem],
					type: RecentType.default,
				});

				await store.dispatch('recent/setCollection', {
					items: [recentItem],
					type: RecentType.collab,
				});

				const parentChatId = 3;
				await store.dispatch('recent/setCollection', {
					items: [recentItem],
					type: RecentType.copilot,
					parentChatId,
				});

				const { recentIndex } = store.state.recent;

				const recentIdSet = recentIndex[RecentModel.ROOT_PARENT_ID][RecentType.default];
				const collabIdSet = recentIndex[RecentModel.ROOT_PARENT_ID][RecentType.collab];
				const copilotParentIdSet = recentIndex[parentChatId][RecentType.copilot];
				assert.equal(recentIdSet.has(recentItem.dialogId), true);
				assert.equal(collabIdSet.has(recentItem.dialogId), true);
				assert.equal(copilotParentIdSet.has(recentItem.dialogId), true);

				await store.dispatch('recent/hide', {
					dialogId: recentItem.dialogId,
				});

				assert.equal(recentIdSet.has(recentItem.dialogId), false);
				assert.equal(collabIdSet.has(recentItem.dialogId), false);
				assert.equal(copilotParentIdSet.has(recentItem.dialogId), false);
			});
		});
		describe('delete', () => {
			it('should delete item with provided dialogId from root collection', async () => {
				const recentItem = getRecentItem({ dialogId: 'chat1' });

				await store.dispatch('recent/setCollection', {
					items: [recentItem],
					type: RecentType.default,
				});

				const { collection } = store.state.recent;

				const storeItem = collection[recentItem.dialogId];
				assert.equal(Boolean(storeItem), true);

				await store.dispatch('recent/delete', {
					dialogId: recentItem.dialogId,
				});

				const updatedStoreItem = collection[recentItem.dialogId];
				assert.equal(Boolean(updatedStoreItem), false);
			});
		});
	});
});

function getRecentItem(params: Partial<ImModelRecentItem> = {}): ImModelRecentItem
{
	return { ...RecentModel.prototype.getElementState(), ...params };
}
