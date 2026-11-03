type ForwardSelectorInitProps = {
	messageIds: number[],
	fromDialogId: string,
	locator: object,
	onDialogSelected: () => any,
	closeOnSelect?: boolean,
}

type ForwardSelectorRecipient = {
	id: string,
	title?: string,
	imageUrl?: string,
}

export { ForwardSelectorInitProps, ForwardSelectorRecipient };
