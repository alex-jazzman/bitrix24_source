interface CheckboxProps
{
	testId: string;
	size?: number;
	checked?: boolean;
	disabled?: boolean;
	// off makes the checkbox presentational: it stops being clickable and only follows the checked prop
	useState?: boolean;
	indeterminate?: boolean;
	background?: Color;
	shape?: CheckboxShape;
	onClick?: () => void;
}

interface CheckboxState
{
	// stays undefined until the first props sync, so the icon is not rendered
	checked?: boolean;
}
