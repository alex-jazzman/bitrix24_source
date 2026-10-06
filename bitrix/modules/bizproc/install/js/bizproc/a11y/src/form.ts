import { Type } from 'main.core';

const DEFAULT_CONTROL_SELECTOR = 'input:not([type="hidden"]), select, textarea';

export type LabelFormControlsOptions = {
	blockSelector: string,
	labelSelector: string,
	contentSelector?: string,
	controlSelector?: string,
};

function readLabel(labelNode: HTMLElement): string
{
	return (labelNode.textContent ?? '').replaceAll('*', '').replace(/:\s*$/, '').trim();
}

function hasAccessibleName(control: HTMLElement): boolean
{
	const labels = (control as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement).labels;

	return Boolean(
		control.getAttribute('aria-label')
		|| control.getAttribute('aria-labelledby')
		|| (labels !== null && labels !== undefined && labels.length > 0),
	);
}

export function labelFormControls(root: HTMLElement, options: LabelFormControlsOptions): void
{
	if (!Type.isDomNode(root))
	{
		return;
	}

	if (!Type.isStringFilled(options?.blockSelector) || !Type.isStringFilled(options?.labelSelector))
	{
		return;
	}

	const controlSelector = Type.isStringFilled(options.controlSelector)
		? (options.controlSelector as string)
		: DEFAULT_CONTROL_SELECTOR;

	root.querySelectorAll<HTMLElement>(options.blockSelector).forEach((block) => {
		const labelNode = block.querySelector<HTMLElement>(options.labelSelector);
		if (!labelNode)
		{
			return;
		}

		const label = readLabel(labelNode);
		if (label === '')
		{
			return;
		}

		// the start form keeps controls right inside the block, the task card wraps them
		const content = Type.isStringFilled(options.contentSelector)
			? block.querySelector<HTMLElement>(options.contentSelector as string)
			: block;
		if (!content)
		{
			return;
		}

		content.querySelectorAll<HTMLElement>(controlSelector).forEach((control) => {
			if (!hasAccessibleName(control))
			{
				control.setAttribute('aria-label', label);
			}
		});
	});
}
