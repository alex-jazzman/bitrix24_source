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
	const { form, store, block, portId, connectedBlocks = null, evaluationStage, onChange } = context;
	const inputElement = findTargetInput(form, button);
	if (!inputElement)
	{
		return;
	}

	const selector = new ValueSelector(store, block, portId, connectedBlocks, evaluationStage);
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

// The very check handleBpSelectorButtonClick makes, exposed so a form-wide handler can filter the
// click before it builds a context of its own.
export function isBpSelectorButtonTarget(target: ?EventTarget): boolean
{
	return target instanceof HTMLElement && target.getAttribute('data-role') === SELECTOR_BUTTON_ROLE;
}

export function handleBpSelectorButtonClick(event: MouseEvent, context): void
{
	const { target } = event;
	if (!isBpSelectorButtonTarget(target))
	{
		return;
	}

	event.stopPropagation();
	void insertSelectedValue(target, context);
}
