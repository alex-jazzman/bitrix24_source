export type ChecklistImportantProps = {
	onClick?: () => void,
	important?: boolean,
	ref?: (ref: Object) => void,
};

export type ChecklistCheckboxProgressProps = {
	onClick?: () => void,
	totalCount?: number,
	completedCount?: number,
};

export type CheckBoxCounterProps = {
	important?: boolean,
	checked?: boolean,
	progressMode?: boolean,
	totalCount?: number,
	completedCount?: number,
	disabled?: boolean,
	onClick?: (checked: boolean) => void,
	showToastNoRights?: () => void,
	ref?: (ref: Object) => void,
};
