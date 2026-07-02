import { IBaseRecentService } from '../base/type';
import { RecentWidgetItem } from '../../../../../messenger/view/recent/types/recent-item';
import { DialogOpenOptions } from '../../../../dialog/types/dialog';

export interface ISelectService extends IBaseRecentService {
	onItemSelected: (itemData: ItemSelectedEventData) => void;
}

export type CommonSelectServiceProps = {
	openDialogOptions?: Partial<DialogOpenOptions>,
}

export type ItemSelectedEventData = RecentWidgetItem & {
	tag?: string,
	type: string,
	sort: number,
	checked: boolean,
	childItems: any[],
	unselectable: boolean,
	showSwipeActions: boolean,
	useBackgroundColor: boolean,
	useEstimatedHeight: boolean,
	useLetterImage: boolean,
	version: any,
}
