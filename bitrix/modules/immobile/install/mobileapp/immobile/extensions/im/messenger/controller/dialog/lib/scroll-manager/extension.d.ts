declare type ScrollToBottomEvent = {
	dialogId: string | number,
	messageId?: string | number,
	withAnimation?: boolean,
	force?: boolean,
	position?: 'top' | 'center' | 'bottom',
}
