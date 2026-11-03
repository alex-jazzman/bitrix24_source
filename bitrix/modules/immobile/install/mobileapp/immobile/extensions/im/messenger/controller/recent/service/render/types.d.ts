import { IBaseRecentService } from '../base/type';
import { RecentModelState } from '../../../../model/recent/src/types';
import { RecentCallData } from '../../../../../messenger/lib/element/recent/types/call';
import { RecentWidgetItemButton } from '../../../../lib/element/recent/types/base';

export interface IRenderService extends IBaseRecentService
{
	hasItemRendered(id: string): boolean;
	hasItemPending(id: string): boolean;
	getItemCollectionSize(): number;
	getSections(): Array<string>;
	showLoader(section?: string):void;
	hideLoader(section?: string): void;
	renderInstant(options?: RenderInstantOptions): Promise<void>;
	beginCoalescingScope(scopeId: string): void;
	endCoalescingScope(scopeId: string): void;
	isCoalescing(): boolean;
	markCompositionChanged(): void;
	getItemList(): Array<RecentItem>;
	setItems(itemList: Array<RecentModelState | CallItemData>, options?: object): void;
	upsertItems(itemList: Array<RecentModelState | CallItemData>, options?: UpsertOptions): void;
	deleteItems(itemList: Array<RecentModelState | CallItemData | {id: string}>, options?: DeleteItemsOptions): void;

	setPreparedItems(itemList: Array<RecentItem>, options?: object): void;
	upsertPreparedItems(itemList: Array<RecentItem>, options?: UpsertOptions): void;

	executeAfterRender(callback: Function): void;

	getRenderStats(): RenderStats;
	resetRenderStats(): void;
}

export type RenderStats = {
	setItemsToNative: number,
	addItemsToNative: number,
	updateItemsToNative: number,
	removeFromNative: number,
	queuePasses: number,
	forcedPasses: number,
	compositionForcedPasses: number,
	scopeFinalPasses: number,
	markedPasses: number,
	skippedIdenticalSetItems: number,
	compositionSignals: number,
};

export type UpsertOptions = {
	findItemMethod?: 'findInCollection' | 'findInNative',
	skipCheckEquality?: boolean,
};

export type RenderInstantOptions = {
	// marks the call as coming from a direct user action or a live external event:
	// such a call goes through an active coalescing scope
	force?: boolean,
};

export type DeleteItemsOptions = {
	// a service row (pagination loader, parent pseudo row, active call banner) is not
	// part of the composition, so its removal does not push the accumulated batch out
	isServiceRow?: boolean,
};

declare type CommonRenderServiceProps = {
	sections: Array<string>,
	defaultSection: string,
	// overrides the idle limit of the coalescing scope; used by tests
	coalescingIdleLimitMs?: number,
	convertorExtension: (items: Array<RecentItem | object>) => Array<RecentWidgetItem | object>,
	// Every field is optional on purpose: a tab config passes only the options it overrides,
	// the render service defaults the rest (`this.props.itemOptions ?? {}`).
	itemOptions?: {
		showCounter?: boolean,
		showActions?: boolean,
		showDraft?: boolean,
		showPin?: boolean,
		getOrder?: (item: RecentItem) => number,
		getDisplayedDate?: (item: RecentItem) => string,
		getRecentItemButton?: (itemId: string) => RecentWidgetItemButton | null,
	},
}

declare type CallItemData = {
	type: 'call',
	id: string,
	call: RecentCallData,
	callStatus: string
};
