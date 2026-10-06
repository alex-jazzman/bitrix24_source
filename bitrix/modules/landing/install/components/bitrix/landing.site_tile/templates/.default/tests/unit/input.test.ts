import { afterEach, beforeEach, describe, it } from 'mocha';
import { assert } from 'chai';

import { LandingSitesAiInput } from '../../src/js/input';

type SubmitCall = {
	method: string,
	action: string,
	initialPrompt: string,
	sessid: string,
};

describe('LandingSitesAiInput', () => {
	let container: HTMLDivElement;
	let frame: HTMLDivElement;
	let box: HTMLDivElement;
	let input: HTMLDivElement;
	let valueInput: HTMLInputElement;
	let icon: HTMLAnchorElement;
	let submitCalls: SubmitCall[];
	let submittedForms: HTMLFormElement[];
	let originalSubmit: typeof HTMLFormElement.prototype.submit;
	let originalBX: unknown;

	const createInput = (): LandingSitesAiInput => {
		const instance = new LandingSitesAiInput({
			frame,
			box,
			input,
			valueInput,
			icon,
		});

		instance.setActive(true);
		box.dispatchEvent(new TransitionEvent('transitionend', {
			bubbles: true,
			propertyName: 'height',
		}));

		return instance;
	};

	const dispatchEnter = (options: KeyboardEventInit = {}): KeyboardEvent => {
		const event = new KeyboardEvent('keydown', {
			key: 'Enter',
			bubbles: true,
			cancelable: true,
			...options,
		});

		input.dispatchEvent(event);

		return event;
	};

	beforeEach(() => {
		container = document.createElement('div');
		frame = document.createElement('div');
		box = document.createElement('div');
		input = document.createElement('div');
		valueInput = document.createElement('input');
		icon = document.createElement('a');
		submitCalls = [];
		submittedForms = [];
		originalSubmit = HTMLFormElement.prototype.submit;
		originalBX = (window as any).BX;

		input.contentEditable = 'true';
		icon.href = '/sites/ai/?create=1';

		box.appendChild(input);
		frame.appendChild(box);
		container.appendChild(frame);
		container.appendChild(valueInput);
		container.appendChild(icon);
		document.body.appendChild(container);

		(window as any).BX = {
			bitrix_sessid: () => 'test-sessid',
		};

		HTMLFormElement.prototype.submit = function submit(): void {
			const formData = new FormData(this);

			submittedForms.push(this);
			submitCalls.push({
				method: this.method,
				action: this.getAttribute('action') || '',
				initialPrompt: String(formData.get('initial_prompt') || ''),
				sessid: String(formData.get('sessid') || ''),
			});
		};
	});

	afterEach(() => {
		HTMLFormElement.prototype.submit = originalSubmit;
		(window as any).BX = originalBX;
		container.remove();
		submittedForms.forEach((form) => {
			form.remove();
		});
	});

	it('submits the initial prompt by Enter', () => {
		createInput();
		input.innerText = 'Создай сайт пекарни';

		const event = dispatchEnter();

		assert.isTrue(event.defaultPrevented);
		assert.deepEqual(submitCalls, [{
			method: 'post',
			action: '/sites/ai/?create=1',
			initialPrompt: 'Создай сайт пекарни',
			sessid: 'test-sessid',
		}]);
	});

	it('keeps Shift+Enter for a new line', () => {
		createInput();
		input.innerText = 'Создай сайт пекарни';

		const event = dispatchEnter({ shiftKey: true });

		assert.isFalse(event.defaultPrevented);
		assert.deepEqual(submitCalls, []);
	});

	it('does not submit an empty prompt by Enter or icon click', () => {
		createInput();
		input.innerText = '   ';

		const event = dispatchEnter();
		icon.click();

		assert.isTrue(event.defaultPrevented);
		assert.deepEqual(submitCalls, []);
	});
});
