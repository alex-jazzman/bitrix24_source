declare type FilterBarProps = {
	testId?: string,
	userId: number,
	timestamp: number,
	parentWidget?: object,
	onUserSelected: (user: object) => void,
	onMonthSelected: (timestamp: number) => void,
};
