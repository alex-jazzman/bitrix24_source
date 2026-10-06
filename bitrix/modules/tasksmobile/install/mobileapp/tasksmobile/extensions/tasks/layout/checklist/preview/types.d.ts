import { LayoutWidget } from '../../../../../../../../../mobile/dev/janative/api';

export type ChecklistPreviewInitialState = {
	title: string,
	completed: number,
	uncompleted: number,
};

export type ChecklistPreviewValue = {
	completed: number,
	uncompleted: number,
};

export type ChecklistThemeComponentParams = {
	field: Object,
};

export type ChecklistPreviewConfig = {
	parentWidget: LayoutWidget,
	checklistController: Object,
	initialState?: ChecklistPreviewInitialState[],
	taskId: number | string,
};

export type ChecklistPreviewProps = {
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
	ThemeComponent?: (params: ChecklistThemeComponentParams) => Object,
};

export type ItemParams = {
	testId: string,
	completedCount: number,
	totalCount: number,
	title: string,
	showBorder: boolean,
	isComplete: boolean,
	isLoading?: boolean,
	onClick?: () => void,
};

export type ItemStubParams = {
	testId: string,
	title: string,
	showBorder?: boolean,
};

export type TitleParams = {
	count?: number,
	testId: string,
	loading?: boolean,
};
