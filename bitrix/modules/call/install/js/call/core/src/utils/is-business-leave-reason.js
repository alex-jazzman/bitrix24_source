import { BusinessLeaveReason } from '../engine/types';

const businessLeaveReasons = Object.values(BusinessLeaveReason);

export function isBusinessLeaveReason(errorCode)
{
	return businessLeaveReasons.includes(String(errorCode ?? ''));
}
