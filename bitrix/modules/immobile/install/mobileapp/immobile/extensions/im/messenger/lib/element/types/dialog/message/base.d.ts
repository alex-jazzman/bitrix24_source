declare type MessageRichLink = {
	title: string,
	description: string,
	previewUrl: string,
	link: string,
}

declare type MessageButton = {
	id: string,
	text: string,
	leftIcon?: string,
	editable: boolean,
	code?: string,
}
