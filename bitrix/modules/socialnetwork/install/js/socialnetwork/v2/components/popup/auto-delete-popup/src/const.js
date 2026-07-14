import { AutoDeleteMessageDelay } from 'socialnetwork.v2.const';

export const delayMap = {
	[AutoDeleteMessageDelay.Off]: 'SONET_AUTO_DELETE_MESSAGE_STATUS_OFF',
	[AutoDeleteMessageDelay.Hour]: 'SONET_AUTO_DELETE_MESSAGE_STATUS_1H',
	[AutoDeleteMessageDelay.Day]: 'SONET_AUTO_DELETE_MESSAGE_STATUS_1D',
	[AutoDeleteMessageDelay.Week]: 'SONET_AUTO_DELETE_MESSAGE_STATUS_1W',
	[AutoDeleteMessageDelay.Month]: 'SONET_AUTO_DELETE_MESSAGE_STATUS_1M',
};
