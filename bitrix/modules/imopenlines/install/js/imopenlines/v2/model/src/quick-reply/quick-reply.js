import { BuilderModel } from 'ui.vue3.vuex';
import { type ActionTree, GetterTree, MutationTree } from 'ui.vue3.vuex';

import { type ImolModelQuickReply, type ImolModelQuickReplySection } from 'imopenlines.v2.model';
import { type QuickReplyPermissions } from 'imopenlines.v2.provider.service';

type QuickReplyState = {
	collection: { [id: number]: ImolModelQuickReply },
	hasNextPage: boolean,
	sections: ImolModelQuickReplySection[],
	manageUrl: string,
	permissions: QuickReplyPermissions,
}

type QuickReplyPayload = {
	replies: ImolModelQuickReply[],
	sections: ImolModelQuickReplySection[],
	hasNextPage: boolean,
	manageUrl: string,
	permissions: QuickReplyPermissions,
};

/* eslint-disable no-param-reassign */
export class QuickReplyModel extends BuilderModel
{
	getName(): string
	{
		return 'quickReply';
	}

	getState(): QuickReplyState
	{
		return {
			collection: {},
			hasNextPage: false,
			sections: [],
			manageUrl: '',
			permissions: {
				canView: true,
				canCreate: false,
			},
		};
	}

	getElementState(): ImolModelQuickReply
	{
		return {
			id: 0,
			name: '',
			text: '',
			sectionId: 0,
			canEdit: false,
			rating: 0,
		};
	}

	getGetters(): GetterTree<QuickReplyState>
	{
		return {
			/** @function openLines/quickReply/getList */
			getList: (state: QuickReplyState) => (): ImolModelQuickReply[] => {
				return Object.values(state.collection)
					.sort((a, b) => b.rating - a.rating);
			},
			/** @function openLines/quickReply/hasNextPage */
			hasNextPage: (state: QuickReplyState) => (): boolean => {
				return state.hasNextPage;
			},
			/** @function openLines/quickReply/getSections */
			getSections: (state: QuickReplyState) => (): ImolModelQuickReplySection[] => {
				return state.sections;
			},
			/** @function openLines/quickReply/getManageUrl */
			getManageUrl: (state: QuickReplyState) => (): string => {
				return state.manageUrl;
			},
			/** @function openLines/quickReply/getPermissions */
			getPermissions: (state: QuickReplyState) => (): QuickReplyPermissions => {
				return state.permissions;
			},
		};
	}

	getActions(): ActionTree<QuickReplyState>
	{
		return {
			/** @function openLines/quickReply/set */
			set: (store, payload: QuickReplyPayload) => {
				store.commit('set', payload);
			},
			/** @function openLines/quickReply/update */
			update: (store, payload: ImolModelQuickReply) => {
				store.commit('update', payload);
			},
			/** @function openLines/quickReply/clear */
			clear: (store) => {
				store.commit('clear');
			},
		};
	}

	getMutations(): MutationTree<QuickReplyState>
	{
		return {
			set: (state: QuickReplyState, payload: QuickReplyPayload) => {
				payload.replies.forEach((item: ImolModelQuickReply) => {
					state.collection[item.id] = { ...this.getElementState(), ...item };
				});
				state.sections = payload.sections;
				state.hasNextPage = payload.hasNextPage;
				state.manageUrl = payload.manageUrl;
				state.permissions = payload.permissions;
			},
			update: (state: QuickReplyState, payload: ImolModelQuickReply) => {
				const existing = state.collection[payload.id];
				state.collection[payload.id] = { ...this.getElementState(), ...existing, ...payload };
			},
			clear: (state: QuickReplyState) => {
				state.collection = {};
				state.sections = [];
				state.hasNextPage = false;
				state.manageUrl = '';
				state.permissions = {
					canView: true,
					canCreate: false,
				};
			},
		};
	}
}
