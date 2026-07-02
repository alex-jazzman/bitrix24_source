import { it, describe } from 'mocha';
import { assert } from 'chai';

import { RadioButton, RadioButtonSize } from '../../src/index';

describe('ui.system.radiobutton', () => {
	describe('constructor', () => {
		it('Throws when options are not provided', () => {
			// @ts-expect-error runtime guard for JS consumers
			assert.throws(() => new RadioButton(), /group/);
		});

		it('Throws when group is empty string', () => {
			assert.throws(() => new RadioButton({ group: '' }), /group/);
		});
	});

	describe('render()', () => {
		it('Renders a native radio input inside a label', () => {
			const wrapper = new RadioButton({ group: 'color' }).render();

			assert.equal(wrapper.tagName, 'LABEL');
			assert.isTrue(wrapper.classList.contains('ui-radio-button'));
			assert.isTrue(wrapper.classList.contains('--size-md'));

			const input = wrapper.querySelector('input[type="radio"]');
			assert.isNotNull(input);
			assert.equal(input.getAttribute('name'), 'color');
		});

		it('Renders the visual box with aria-hidden', () => {
			const wrapper = new RadioButton({ group: 'color' }).render();
			const box = wrapper.querySelector('.ui-radio-button__box');

			assert.isNotNull(box);
			assert.equal(box.getAttribute('aria-hidden'), 'true');
		});

		it('Returns the same wrapper element on repeated calls', () => {
			const instance = new RadioButton({ group: 'color' });
			const first = instance.render();
			const second = instance.render();

			assert.strictEqual(first, second);
		});

		it('Renders an empty box when unchecked', () => {
			const wrapper = new RadioButton({ group: 'color' }).render();
			const box = wrapper.querySelector('.ui-radio-button__box');

			assert.isNull(box.querySelector('.ui-radio-button__dot'));
		});

		it('Renders the dot when initially checked', () => {
			const wrapper = new RadioButton({ group: 'color', checked: true }).render();
			const box = wrapper.querySelector('.ui-radio-button__box');

			assert.isNotNull(box.querySelector('.ui-radio-button__dot'));
		});
	});

	describe('size', () => {
		it('Applies md size by default', () => {
			const instance = new RadioButton({ group: 'color' });

			assert.equal(instance.getSize(), RadioButtonSize.Md);
			assert.isTrue(instance.render().classList.contains('--size-md'));
		});

		it('Applies size passed to the constructor', () => {
			const instance = new RadioButton({ group: 'color', size: RadioButtonSize.Sm });

			assert.equal(instance.getSize(), RadioButtonSize.Sm);
			assert.isTrue(instance.render().classList.contains('--size-sm'));
		});

		it('setSize() updates the modifier class', () => {
			const instance = new RadioButton({ group: 'color' });
			const wrapper = instance.render();

			instance.setSize(RadioButtonSize.Lg);

			assert.equal(instance.getSize(), RadioButtonSize.Lg);
			assert.isTrue(wrapper.classList.contains('--size-lg'));
			assert.isFalse(wrapper.classList.contains('--size-md'));
		});

		it('setSize() ignores invalid values', () => {
			const instance = new RadioButton({ group: 'color' });
			instance.render();

			// @ts-expect-error runtime guard for JS consumers — TS blocks this at compile time
			instance.setSize('huge');

			assert.equal(instance.getSize(), RadioButtonSize.Md);
		});
	});

	describe('checked', () => {
		it('isChecked() is false by default', () => {
			assert.isFalse(new RadioButton({ group: 'color' }).isChecked());
		});

		it('setChecked(true) adds the --checked class and renders dot', () => {
			const instance = new RadioButton({ group: 'color' });
			const wrapper = instance.render();

			instance.setChecked(true);

			assert.isTrue(instance.isChecked());
			assert.isTrue(wrapper.classList.contains('--checked'));
			assert.isNotNull(wrapper.querySelector('.ui-radio-button__dot'));
			assert.isTrue(wrapper.querySelector('input').checked);
		});

		it('setChecked(false) removes the --checked class and dot', () => {
			const instance = new RadioButton({ group: 'color', checked: true });
			const wrapper = instance.render();

			instance.setChecked(false);

			assert.isFalse(instance.isChecked());
			assert.isFalse(wrapper.classList.contains('--checked'));
			assert.isNull(wrapper.querySelector('.ui-radio-button__dot'));
		});
	});

	describe('disabled', () => {
		it('isDisabled() is false by default', () => {
			assert.isFalse(new RadioButton({ group: 'color' }).isDisabled());
		});

		it('Applies --disabled and disables input when constructed disabled', () => {
			const instance = new RadioButton({ group: 'color', disabled: true });
			const wrapper = instance.render();

			assert.isTrue(instance.isDisabled());
			assert.isTrue(wrapper.classList.contains('--disabled'));
			assert.isTrue(wrapper.querySelector('input').disabled);
		});

		it('setDisabled() toggles the state', () => {
			const instance = new RadioButton({ group: 'color' });
			const wrapper = instance.render();

			instance.setDisabled(true);
			assert.isTrue(wrapper.querySelector('input').disabled);

			instance.setDisabled(false);
			assert.isFalse(wrapper.querySelector('input').disabled);
		});
	});

	describe('attributes pass-through', () => {
		it('Passes custom HTML attributes to the input', () => {
			const input = new RadioButton({
				group: 'color',
				attributes: { id: 'my-rb', 'data-test': 'value', 'aria-label': 'Red' },
			}).render().querySelector('input');

			assert.equal(input.getAttribute('id'), 'my-rb');
			assert.equal(input.getAttribute('data-test'), 'value');
			assert.equal(input.getAttribute('aria-label'), 'Red');
		});

		it('Does not let custom attributes override reserved attributes', () => {
			const input = new RadioButton({
				group: 'color',
				checked: true,
				disabled: true,
				attributes: {
					type: 'text',
					class: 'my-class',
					name: 'other-group',
					checked: 'false',
					disabled: 'false',
				},
			}).render().querySelector('input');

			assert.equal(input.getAttribute('type'), 'radio');
			assert.isFalse(input.classList.contains('my-class'));
			assert.isTrue(input.classList.contains('ui-radio-button__input'));
			assert.equal(input.getAttribute('name'), 'color');
			assert.isTrue(input.checked);
			assert.isTrue(input.disabled);
		});
	});

	describe('onChange', () => {
		it('Invokes onChange with the new checked value on user change', () => {
			let received = null;
			const input = new RadioButton({
				group: 'color',
				onChange: ({ checked }) => { received = checked; },
			}).render().querySelector('input');

			input.checked = true;
			input.dispatchEvent(new Event('change'));

			assert.isTrue(received);
		});

		it('setOnChange() replaces the callback at runtime', () => {
			const instance = new RadioButton({
				group: 'color',
				onChange: () => { throw new Error('old'); },
			});
			const input = instance.render().querySelector('input');

			let received = null;
			instance.setOnChange(({ checked }) => { received = checked; });

			input.checked = true;
			input.dispatchEvent(new Event('change'));

			assert.isTrue(received);
		});
	});

	describe('fluent API', () => {
		it('Flag setters default to true when called without arguments', () => {
			const instance = new RadioButton({ group: 'color' });
			instance.render();

			instance.setChecked();
			assert.isTrue(instance.isChecked());

			instance.setDisabled();
			assert.isTrue(instance.isDisabled());
		});

		it('Setters return the instance for chaining', () => {
			const instance = new RadioButton({ group: 'color' });
			instance.render();

			const result = instance
				.setSize(RadioButtonSize.Lg)
				.setChecked()
				.setDisabled()
				.setOnChange(() => {});

			assert.strictEqual(result, instance);
			assert.equal(instance.getSize(), RadioButtonSize.Lg);
			assert.isTrue(instance.isChecked());
			assert.isTrue(instance.isDisabled());
		});
	});

	describe('destroy()', () => {
		it('Removes the wrapper from the DOM', () => {
			const instance = new RadioButton({ group: 'color' });
			const wrapper = instance.render();
			const parent = document.createElement('div');
			parent.append(wrapper);

			instance.destroy();

			assert.isNull(wrapper.parentNode);
		});

		it('Unbinds the change listener', () => {
			let calls = 0;
			const instance = new RadioButton({
				group: 'color',
				onChange: () => { calls += 1; },
			});
			const input = instance.render().querySelector('input');

			instance.destroy();

			input.checked = true;
			input.dispatchEvent(new Event('change'));

			assert.equal(calls, 0);
		});

		it('Re-renders a fresh wrapper after destroy', () => {
			const instance = new RadioButton({ group: 'color' });
			const first = instance.render();

			instance.destroy();
			const second = instance.render();

			assert.notStrictEqual(first, second);
		});
	});
});
