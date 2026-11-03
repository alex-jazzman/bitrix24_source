interface TimelineItemHeaderCheckboxProps
{
	testId: string;
	checked?: boolean;
	isReadonly?: boolean;
	onClick?: () => void;
}

interface TimelineItemHeaderCheckboxState
{
	checked: boolean;
}

interface TimelineItemHeaderPinButtonProps
{
	testId: string;
	pinned?: boolean;
	isReadonly?: boolean;
	onClick?: () => void;
}

interface TimelineItemHeaderPinButtonState
{
	pinned: boolean;
}
