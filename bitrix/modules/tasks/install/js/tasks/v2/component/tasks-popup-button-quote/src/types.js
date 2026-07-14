export type TypePropsGetDataSelection = {
	nodeAnchor: any,
	eventStart: any,
	eventFinish: any,
};

type TypeCoordsSelection = {
	pageX: number;
	pageY: number;
};

export type TypeDataSelection = {
	coordsSelection: TypeCoordsSelection;
	quote: string;
};

export type TypeAction = {
	type: string;
	icon: string;
	chatId: string | number;
	isClosingPrevented: boolean;
};

export type TypeDataQuote = {
	event: any;
	type: string;
	quote: string;
};
