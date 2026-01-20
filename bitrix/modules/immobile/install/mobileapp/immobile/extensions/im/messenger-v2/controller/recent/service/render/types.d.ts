import { IBaseRecentService } from '../base/type';
import { RecentModelState } from '../../../../../messenger/model/recent/src/types';
import { RecentCallData } from '../../../../../messenger/lib/element/recent/types/call';

export interface IRenderService extends IBaseRecentService
{
	hasItemRendered(id: string): boolean;
	getItemCollectionSize(): number;
	getSections(): Array<string>;
	showLoader(section?: string):void;
	hideLoader(section?: string): void;
	renderInstant(): Promise<void>;
	setItems(itemList: Array<RecentModelState | CallItemData>, options?: object): void;
	upsertItems(itemList: Array<RecentModelState | CallItemData>, options?: UpsertOptions): void;
	deleteItems(itemList: Array<RecentModelState | CallItemData | {id: string}>, options?: object): void;

	setPreparedItems(itemList: Array<RecentItem>, options?: object): void;
	upsertPreparedItems(itemList: Array<RecentItem>, options?: UpsertOptions): void;

	executeAfterRender(callback: Function): void;
}

export type UpsertOptions = {
	findItemMethod?: 'findInCollection' | 'findInNative',
	skipCheckEquality?: boolean,
};

declare type CommonRenderServiceProps = {
	sections: Array<string>,
	defaultSection: string,
	itemOptions?: {
		showCounter: boolean,
		showActions: boolean,
		showDraft: boolean,
		showPin: boolean,
		getOrder: (item: RecentItem) => number,
		getDisplayedDate: (item: RecentItem) => string,
	},
}

declare type CallItemData = {
	type: 'call',
	id: string,
	call: RecentCallData,
	callStatus: string
};
