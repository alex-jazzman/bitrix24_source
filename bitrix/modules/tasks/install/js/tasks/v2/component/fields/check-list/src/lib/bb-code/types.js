export type SelectionRange = {
	start: number,
	end: number,
};

export type FormattingTag = {
	open: string,
	close: string,
	type: string,
};

export type FormattingRange = {
	openStart: number,
	openEnd: number,
	openTag: string,
	contentStart: number,
	contentEnd: number,
	closeStart: number,
	closeEnd: number,
	closeTag: string,
};

export type SelectedFormattingRange = {
	range: FormattingRange,
	selection: SelectionRange,
};

export type FormattingResult = {
	source: string,
	selectionStart: number,
	selectionEnd: number,
};
