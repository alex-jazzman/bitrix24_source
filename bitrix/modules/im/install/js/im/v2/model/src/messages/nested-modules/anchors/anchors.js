import { Type } from 'main.core';
import { BuilderModel, GetterTree, ActionTree, MutationTree } from 'ui.vue3.vuex';

import { Core } from 'im.v2.application.core';
import { type AnchorType, ChatType } from 'im.v2.const';

import { isAnchorsEqual, isAnchorWithTypeFromCurrentChat } from './helpers';

import { type Anchor } from '../../../type/anchor';

type AnchorsState = {
	anchors: Anchor[];
};

export class AnchorsModel extends BuilderModel
{
	getName(): string
	{
		return 'anchors';
	}

	getState(): AnchorsState
	{
		return {
			anchors: [],
		};
	}

	// eslint-disable-next-line max-lines-per-function
	getGetters(): GetterTree {
		return {
			/** @function messages/anchors/getChatMessageIdsWithAnchors */
			getChatMessageIdsWithAnchors: (state: AnchorsState) => (
				chatId: number,
			): number[] => {
				return [...state.anchors]
					.filter((anchor) => {
						return anchor.chatId === chatId;
					})
					.map((anchor) => anchor.messageId)
				;
			},
			/** @function messages/anchors/isMessageHasAnchors */
			isMessageHasAnchors: (state: AnchorsState) => (
				messageId: number,
			): boolean => {
				return state.anchors.some((anchor) => {
					return anchor.messageId === messageId;
				});
			},
			/** @function messages/anchors/isChatHasAnchors */
			isChatHasAnchors: (state: AnchorsState) => (chatId: number): boolean => {
				return state.anchors.some((anchor) => {
					return anchor.chatId === chatId;
				});
			},
			/** @function messages/anchors/isChatHasAnchorsWithType */
			isChatHasAnchorsWithType: (state: AnchorsState) => (
				chatId: number,
				anchorType: AnchorType,
			): boolean => {
				return state.anchors.some((anchor) => {
					return isAnchorWithTypeFromCurrentChat(anchor, anchorType, chatId);
				});
			},
			/** @function messages/anchors/getCounterInChatByType */
			getCounterInChatByType: (state: AnchorsState) => (
				chatId: number,
				anchorType: AnchorType,
			): number => {
				const chatAnchors = state.anchors.filter((anchor) => {
					return isAnchorWithTypeFromCurrentChat(anchor, anchorType, chatId);
				});

				return new Set(chatAnchors.map((chatAnchor) => chatAnchor.messageId)).size;
			},
			/** @function messages/anchors/getNextMessageIdWithAnchorType */
			getNextMessageIdWithAnchorType: (state: AnchorsState) => (
				chatId: number,
				anchorType: AnchorType,
			): number | null => {
				const anchors: Anchor[] = state.anchors
					.filter((anchor) => {
						return isAnchorWithTypeFromCurrentChat(anchor, anchorType, chatId);
					})
					.sort((anchorOne, anchorTwo) => anchorOne.messageId - anchorTwo.messageId)
				;

				return anchors.at(0)?.messageId;
			},
			/** @function messages/anchors/getAnchorsByChatType */
			getAnchorsByChatType: (state: AnchorsState) => (chatType: $Values<typeof ChatType>) => {
				return state.anchors.filter((anchor: Anchor) => {
					const { type } = Core.getStore().getters['chats/getByChatId'](anchor.chatId, true);

					return type === chatType;
				});
			},
		};
	}

	getActions(): ActionTree
	{
		return {
			/** @function messages/anchors/setAnchors */
			setAnchors: (store, payload: { anchors: [] }) => {
				if (Type.isPlainObject(payload) === false)
				{
					return;
				}

				store.commit('setAnchors', { anchors: payload.anchors });
			},
			/** @function messages/anchors/addAnchor */
			addAnchor: (store, payload: {anchor: Anchor}) => {
				if (Type.isPlainObject(payload) === false)
				{
					return;
				}

				const equalAnchor = store.state.anchors.find((anchor) => {
					return isAnchorsEqual(anchor, payload.anchor);
				});

				if (!equalAnchor)
				{
					store.commit('addAnchor', payload);
				}
			},
			/** @function messages/anchors/removeAnchor */
			removeAnchor: (store, payload: {anchor: Anchor}) => {
				if (Type.isPlainObject(payload) === false)
				{
					return;
				}

				store.commit('removeAnchor', payload);
			},
			/** @function messages/anchors/removeUserAnchorsFromMessage */
			removeUserAnchorsFromMessage: (store, messageId: string) => {
				store.state.anchors.forEach((anchor) => {
					if (anchor.messageId === messageId)
					{
						store.commit('removeAnchor', { anchor });
					}
				});
			},
			/** @function messages/anchors/removeChatAnchors */
			removeChatAnchors: (store, chatId: number) => {
				store.commit('removeChatAnchors', chatId);
			},
			/** @function messages/anchors/removeAllAnchorsByChatType */
			removeAllAnchorsByChatType: (store, payload: { type: $Values<typeof ChatType> }) => {
				store.commit('removeAllAnchorsByChatType', payload);
			},
			/** @function messages/anchors/removeAllAnchors */
			removeAllAnchors: (store) => {
				store.commit('removeAllAnchors');
			},
		};
	}

	getMutations(): MutationTree
	{
		return {
			setAnchors: (state: AnchorsState, payload: {anchors: Anchor[]}) => {
				// eslint-disable-next-line no-param-reassign
				state.anchors = [...payload.anchors];
			},
			addAnchor: (state: AnchorsState, payload: {anchor: Anchor}) => {
				state.anchors.push(payload.anchor);
			},
			removeAnchor: (state: AnchorsState, payload: {anchor: Anchor}) => {
				const removedAnchorIndex = state.anchors.findIndex((anchor) => {
					return isAnchorsEqual(anchor, payload.anchor);
				});

				if (removedAnchorIndex > -1)
				{
					state.anchors.splice(removedAnchorIndex, 1);
				}
			},
			removeChatAnchors: (state: AnchorsState, chatId: number) => {
				// eslint-disable-next-line no-param-reassign
				state.anchors = state.anchors.filter((anchor: Anchor) => {
					return anchor.chatId !== chatId;
				});
			},
			removeAllAnchorsByChatType: (state: AnchorsState, payload: { type: $Values<typeof ChatType> }) => {
				const { type } = payload;
				const anchors = Core.getStore().getters['messages/anchors/getAnchorsByChatType'](type);
				const chatIds = new Set(anchors.map((anchor: Anchor) => anchor.chatId));

				// eslint-disable-next-line no-param-reassign
				state.anchors = state.anchors.filter((anchor: Anchor) => {
					return !chatIds.has(anchor.chatId);
				});
			},
			removeAllAnchors: (state: AnchorsState) => {
				// eslint-disable-next-line no-param-reassign
				state.anchors = [];
			},
		};
	}
}
