export function getToggleAriaState(isChecked: boolean): { role: 'switch', ariaChecked: 'true' | 'false' }
{
	return {
		role: 'switch',
		ariaChecked: isChecked ? 'true' : 'false',
	};
}
