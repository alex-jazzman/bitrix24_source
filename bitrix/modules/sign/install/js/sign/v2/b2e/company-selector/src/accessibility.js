import { Dom, Event as CoreEvent } from 'main.core';

const activationKeys = new Set(['Enter', ' ']);

export const setupAccessibleTrigger = (
	element: HTMLElement,
	options: {
		hasPopup: 'dialog' | 'menu',
		label?: string,
		testId?: string,
		onActivate: (event: Event | KeyboardEvent) => void,
		stopPropagation?: boolean,
	},
): { setExpanded: (expanded: boolean) => void } => {
	const isButton = element.tagName === 'BUTTON';
	const attrs: { [key: string]: string } = {
		'aria-haspopup': options.hasPopup,
		'aria-expanded': 'false',
	};

	if (!isButton)
	{
		attrs.role = 'button';
		attrs.tabindex = '0';
	}

	if (options.label)
	{
		attrs['aria-label'] = options.label;
	}

	if (options.testId)
	{
		attrs['data-test-id'] = options.testId;
	}

	Dom.attr(element, attrs);

	const activate = (event: Event | KeyboardEvent): void => {
		if (options.stopPropagation)
		{
			event.stopPropagation();
		}

		options.onActivate(event);
	};

	CoreEvent.bind(element, 'click', activate);
	CoreEvent.bind(element, 'keydown', (event: KeyboardEvent) => {
		if (!activationKeys.has(event.key))
		{
			return;
		}

		event.preventDefault();
		activate(event);
	});

	return {
		setExpanded: (expanded: boolean): void => {
			Dom.attr(element, 'aria-expanded', expanded ? 'true' : 'false');
		},
	};
};
