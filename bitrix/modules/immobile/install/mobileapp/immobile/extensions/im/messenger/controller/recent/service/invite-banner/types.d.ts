import { IBaseRecentService } from '../base/type';

export interface IInviteBannerService extends IBaseRecentService
{
	subscribeEvents: () => void;
	redraw: () => void;
}
