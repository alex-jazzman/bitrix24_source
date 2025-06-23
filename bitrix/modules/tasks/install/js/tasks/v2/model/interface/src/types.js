export type InterfaceModelParams = {
	currentUserId: number,
	defaultDeadline: DefaultDeadline,
};

export type InterfaceModelState = {
	currentUserId: number,
	titleFieldOffsetHeight: ?number,
	defaultDeadline: DefaultDeadline,
};

export type DefaultDeadline = {
	defaultDeadlineInSeconds: number,
	defaultDeadlineDate: string,
};
