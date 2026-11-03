import { Core } from 'im.v2.application.core';
import { type ImModelUser } from 'im.v2.model';
import type { AddActiveCallParams, AppLayout, ChatFields, ChatInfo, RecentCall } from '../type/im';

export interface ImStore
{
	getCurrentUserId(): number;
	getRecentCallByDialog(dialogId: string): RecentCall | null;
	getRecentCalls(): RecentCall[];
	hasActiveCall(dialogId?: string): boolean;
	addActiveCall(params: AddActiveCallParams): void;
	updateActiveCall(dialogId: string, fields: Partial<RecentCall>): void;
	deleteActiveCall(dialogId: string): void;
	getChat(dialogId: string, full?: boolean): ChatInfo;
	addChat(fields: ChatFields): void;
	getUser(id: number | string): ImModelUser;
	isGuest(id: number): boolean;
	getTotalChatCounter(): number;
	getLayout(): AppLayout;
}

const methods = {
	getCurrentUserId(): number
	{
		return Core.getUserId();
	},
	getRecentCallByDialog(dialogId: string): RecentCall | null
	{
		// @ts-ignore [call-ts] im store is untyped
		return Core.getStore().getters['recent/calls/getCallByDialog'](dialogId) ?? null;
	},
	getRecentCalls(): RecentCall[]
	{
		// @ts-ignore [call-ts] im store is untyped
		return Core.getStore().getters['recent/calls/get'];
	},
	hasActiveCall(dialogId?: string): boolean
	{
		// @ts-ignore [call-ts] im store is untyped
		return Core.getStore().getters['recent/calls/hasActiveCall'](dialogId);
	},
	addActiveCall(params: AddActiveCallParams): void
	{
		// @ts-ignore [call-ts] im store is untyped
		void Core.getStore().dispatch('recent/calls/addActiveCall', params);
	},
	updateActiveCall(dialogId: string, fields: Partial<RecentCall>): void
	{
		// @ts-ignore [call-ts] im store is untyped
		void Core.getStore().dispatch('recent/calls/updateActiveCall', { dialogId, fields });
	},
	deleteActiveCall(dialogId: string): void
	{
		// @ts-ignore [call-ts] im store is untyped
		void Core.getStore().dispatch('recent/calls/deleteActiveCall', { dialogId });
	},
	getChat(dialogId: string, full: boolean = false): ChatInfo
	{
		// @ts-ignore [call-ts] im store is untyped
		return Core.getStore().getters['chats/get'](dialogId, full);
	},
	addChat(fields: ChatFields): void
	{
		// @ts-ignore [call-ts] im store is untyped
		void Core.getStore().dispatch('chats/add', fields);
	},
	getUser(id: number | string): ImModelUser
	{
		// @ts-ignore [call-ts] im store is untyped
		return Core.getStore().getters['users/get'](id);
	},
	isGuest(id: number): boolean
	{
		// @ts-ignore [call-ts] im store is untyped
		return Core.getStore().getters['users/isGuest'](id);
	},
	getTotalChatCounter(): number
	{
		// @ts-ignore [call-ts] im store is untyped
		return Core.getStore().getters['counters/getTotalChatCounter'];
	},
	getLayout(): AppLayout
	{
		// @ts-ignore [call-ts] im store is untyped
		return Core.getStore().getters['application/getLayout'];
	},
};

export const ImStoreAdapter = new Proxy(methods, {
	get(target, property)
	{
		if (Reflect.has(target, property))
		{
			return Reflect.get(target, property);
		}

		throw new Error(`ImStore: method "${String(property)}" is not registered in the adapter.`);
	},
}) as ImStore;
