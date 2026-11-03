import { IBaseRecentService } from '../base/type';

export interface IItemButtonService extends IBaseRecentService {
	onItemButtonTap: (eventData: ItemButtonTapEventData) => Promise<void>;
}

export type ItemButtonServiceProps = {
	onItemButtonTap: (itemId: string) => Promise<void>,
}

export type ItemButtonTapEventData = {
	itemId?: string,
	buttonId?: string,
}
