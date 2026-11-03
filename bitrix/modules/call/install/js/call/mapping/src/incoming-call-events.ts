export interface IncomingCallEventMap
{
	readonly onClose: 'onClose';
	readonly onDestroy: 'onDestroy';
	readonly onButtonClick: 'onButtonClick';
}

export interface IncomingCallInternalEventMap
{
	readonly setHasCamera: 'CallNotification::setHasCamera';
	readonly contentReady: 'CallNotification::contentReady';
	readonly onButtonClick: 'CallNotification::onButtonClick';
}

export const IncomingCallEvent: IncomingCallEventMap = Object.freeze({
	onClose: 'onClose',
	onDestroy: 'onDestroy',
	onButtonClick: 'onButtonClick',
});

export const IncomingCallInternalEvent: IncomingCallInternalEventMap = Object.freeze({
	setHasCamera: 'CallNotification::setHasCamera',
	contentReady: 'CallNotification::contentReady',
	onButtonClick: 'CallNotification::onButtonClick',
});
