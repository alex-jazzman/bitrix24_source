declare type ChecklistPreviewInitialState = {
	title: string,
	completed: number,
	uncompleted: number,
};

declare type ChecklistPreviewValue = {
	completed: number,
	uncompleted: number,
};

declare type ChecklistPreviewConfig = {
	parentWidget: Object,
	checklistController: Object,
	initialState?: ChecklistPreviewInitialState[],
	taskId: number | string,
};

declare type ChecklistPreviewProps = {
	id: string,
	testId: string,
	value: ChecklistPreviewValue,
	readOnly?: boolean,
	disabled?: boolean,
	multiple?: boolean,
	loading?: boolean,
	hideTitle?: boolean,
	maxElements?: number,
	showAddButton?: boolean,
	config: ChecklistPreviewConfig,
	onChange?: (value: ChecklistPreviewValue) => void,
	onContentClick?: (field: Object) => void,
	onLayout?: (field: Object) => void,
	ThemeComponent?: Function,
};
