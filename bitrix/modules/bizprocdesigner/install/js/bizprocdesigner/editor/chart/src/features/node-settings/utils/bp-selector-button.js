import { ValueSelector } from '../../../entities/common-node-settings';

const SELECTOR_BUTTON_ROLE = 'bp-selector-button';

function findTargetInput(form: ?HTMLElement, button: HTMLElement): ?HTMLElement
{
	const propsAttribute = button.getAttribute('data-bp-selector-props');
	if (propsAttribute)
	{
		const controlId = (JSON.parse(propsAttribute))?.controlId ?? null;
		if (controlId && form)
		{
			const controlById = form.querySelector(`#${CSS.escape(controlId)}`);
			if (controlById)
			{
				return controlById;
			}
		}
	}

	return button.closest('.field-row')?.querySelector('input[type="text"], textarea') ?? null;
}

async function insertSelectedValue(button: HTMLElement, context): Promise<void>
{
	const { form, store, block, portId, onChange } = context;
	const inputElement = findTargetInput(form, button);
	if (!inputElement)
	{
		return;
	}

	const selector = new ValueSelector(store, block, portId);
	try
	{
		const value = await selector.show(button);
		const beforePart = inputElement.value.slice(0, inputElement.selectionEnd || 0);
		const afterPart = inputElement.value.slice(inputElement.selectionEnd || 0);

		inputElement.value = beforePart + value + afterPart;
		inputElement.selectionEnd = beforePart.length + value.length;
		inputElement.focus();
		inputElement.dispatchEvent(new window.Event('change'));
		onChange();
	}
	catch (error)
	{
		console.error(error);
	}
}

export function handleBpSelectorButtonClick(event: MouseEvent, context): void
{
	const { target } = event;
	if (!(target instanceof HTMLElement) || target.getAttribute('data-role') !== SELECTOR_BUTTON_ROLE)
	{
		return;
	}

	event.stopPropagation();
	void insertSelectedValue(target, context);
}
