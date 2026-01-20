import { IBaseRecentService } from '../base/type';
import { CallItemData } from '../render/types';

export interface IExternalService extends IBaseRecentService
{
    getCallList: () => Array<CallItemData>,
}
