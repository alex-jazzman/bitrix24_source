import { it, describe } from 'mocha';
import { assert } from 'chai';

import { Checkbox, CheckboxSize } from '../../src/index';

describe('ui.system.checkbox', () => {
	describe('render()', () => {
		it('Renders a native input inside a label', () => {
			const wrapper = new Checkbox().render();

			assert.equal(wrapper.tagName, 'LABEL');
			assert.isTrue(wrapper.classList.contains('ui-checkbox'));
			assert.isTrue(wrapper.classList.contains('--size-md'));
			assert.isNotNull(wrapper.querySelector('input[type="checkbox"]'));
		});

		it('Renders the visual box with aria-hidden', () => {
			const wrapper = new Checkbox().render();
			const box = wrapper.querySelector('.ui-checkbox__box');

			assert.isNotNull(box);
			assert.equal(box.getAttribute('aria-hidden'), 'true');
		});

		it('Returns the same wrapper element on repeated calls', () => {
			const instance = new Checkbox();
			const first = instance.render();
			const second = instance.render();

			assert.strictEqual(first, second);
		});

		it('Renders an empty box when unchecked and not indeterminate', () => {
			const wrapper = new Checkbox().render();
			const box = wrapper.querySelector('.ui-checkbox__box');

			assert.isNull(box.querySelector('.ui-checkbox__icon'));
			assert.isNull(box.querySelector('.ui-checkbox__dash'));
		});

		it('Renders the check icon when initially checked', () => {
			const wrapper = new Checkbox({ checked: true }).render();
			const box = wrapper.querySelector('.ui-checkbox__box');

			assert.isNotNull(box.querySelector('.ui-checkbox__icon'));
			assert.isNull(box.querySelector('.ui-checkbox__dash'));
		});

		it('Renders the dash when initially indeterminate', () => {
			const wrapper = new Checkbox({ indeterminate: true }).render();
			const box = wrapper.querySelector('.ui-checkbox__box');

			assert.isNotNull(box.querySelector('.ui-checkbox__dash'));
			assert.isNull(box.querySelector('.ui-checkbox__icon'));
		});

		it('Prefers dash over icon when both checked and indeterminate are set', () => {
			const wrapper = new Checkbox({ checked: true, indeterminate: true }).render();
			const box = wrapper.querySelector('.ui-checkbox__box');

			assert.isNotNull(box.querySelector('.ui-checkbox__dash'));
			assert.isNull(box.querySelector('.ui-checkbox__icon'));
			assert.isFalse(wrapper.classList.contains('--checked'));
			assert.isTrue(wrapper.classList.contains('--indeterminate'));
		});
	});

	describe('size', () => {
		it('Applies md size by default', () => {
			const instance = new Checkbox();

			assert.equal(instance.getSize(), CheckboxSize.Md);
			assert.isTrue(instance.render().classList.contains('--size-md'));
		});

		it('Applies size passed to the constructor', () => {
			const instance = new Checkbox({ size: CheckboxSize.Sm });

			assert.equal(instance.getSize(), CheckboxSize.Sm);
			assert.isTrue(instance.render().classList.contains('--size-sm'));
		});

		it('setSize() updates the modifier class', () => {
			const instance = new Checkbox();
			const wrapper = instance.render();

			instance.setSize(CheckboxSize.Lg);

			assert.equal(instance.getSize(), CheckboxSize.Lg);
			assert.isTrue(wrapper.classList.contains('--size-lg'));
			assert.isFalse(wrapper.classList.contains('--size-md'));
		});

		it('setSize() ignores invalid values', () => {
			const instance = new Checkbox();
			instance.render();

			// @ts-expect-error runtime guard for JS consumers — TS blocks this at compile time
			instance.setSize('huge');

			assert.equal(instance.getSize(), CheckboxSize.Md);
		});
	});

	describe('checked', () => {
		it('isChecked() is false by default', () => {
			assert.isFalse(new Checkbox().isChecked());
		});

		it('setChecked(true) adds the --checked class and renders icon', () => {
			const instance = new Checkbox();
			const wrapper = instance.render();

			instance.setChecked(true);

			assert.isTrue(instance.isChecked());
			assert.isTrue(wrapper.classList.contains('--checked'));
			assert.isNotNull(wrapper.querySelector('.ui-checkbox__icon'));
			assert.isTrue(wrapper.querySelector('input').checked);
		});

		it('setChecked(false) removes the --checked class and icon', () => {
			const instance = new Checkbox({ checked: true });
			const wrapper = instance.render();

			instance.setChecked(false);

			assert.isFalse(instance.isChecked());
			assert.isFalse(wrapper.classList.contains('--checked'));
			assert.isNull(wrapper.querySelector('.ui-checkbox__icon'));
		});

		it('setChecked(true) clears indeterminate', () => {
			const instance = new Checkbox({ indeterminate: true });
			instance.render();

			instance.setChecked(true);

			assert.isFalse(instance.isIndeterminate());
			assert.isTrue(instance.isChecked());
		});
	});

	describe('indeterminate', () => {
		it('isIndeterminate() is false by default', () => {
			assert.isFalse(new Checkbox().isIndeterminate());
		});

		it('setIndeterminate(true) sets the IDL property and aria-checked=mixed', () => {
			const instance = new Checkbox();
			const wrapper = instance.render();
			const input = wrapper.querySelector('input');

			instance.setIndeterminate(true);

			assert.isTrue(instance.isIndeterminate());
			assert.isTrue(input.indeterminate);
			assert.equal(input.getAttribute('aria-checked'), 'mixed');
			assert.isTrue(wrapper.classList.contains('--indeterminate'));
			assert.isNotNull(wrapper.querySelector('.ui-checkbox__dash'));
		});

		it('setIndeterminate(false) clears the dash and aria attribute', () => {
			const instance = new Checkbox({ indeterminate: true });
			const wrapper = instance.render();
			const input = wrapper.querySelector('input');

			instance.setIndeterminate(false);

			assert.isFalse(input.indeterminate);
			assert.isNull(input.getAttribute('aria-checked'));
			assert.isFalse(wrapper.classList.contains('--indeterminate'));
			assert.isNull(wrapper.querySelector('.ui-checkbox__dash'));
		});
	});

	describe('disabled', () => {
		it('isDisabled() is false by default', () => {
			assert.isFalse(new Checkbox().isDisabled());
		});

		it('Applies --disabled and disables input when constructed disabled', () => {
			const instance = new Checkbox({ disabled: true });
			const wrapper = instance.render();

			assert.isTrue(instance.isDisabled());
			assert.isTrue(wrapper.classList.contains('--disabled'));
			assert.isTrue(wrapper.querySelector('input').disabled);
		});

		it('setDisabled() toggles the state', () => {
			const instance = new Checkbox();
			const wrapper = instance.render();

			instance.setDisabled(true);
			assert.isTrue(instance.isDisabled());
			assert.isTrue(wrapper.classList.contains('--disabled'));
			assert.isTrue(wrapper.querySelector('input').disabled);

			instance.setDisabled(false);
			assert.isFalse(instance.isDisabled());
			assert.isFalse(wrapper.classList.contains('--disabled'));
			assert.isFalse(wrapper.querySelector('input').disabled);
		});
	});

	describe('fluent API', () => {
		it('Flag setters default to true when called without arguments', () => {
			const instance = new Checkbox();
			instance.render();

			instance.setChecked();
			assert.isTrue(instance.isChecked());

			instance.setIndeterminate();
			assert.isTrue(instance.isIndeterminate());

			instance.setDisabled();
			assert.isTrue(instance.isDisabled());
		});

		it('Setters return the instance for chaining', () => {
			const instance = new Checkbox();
			instance.render();

			const result = instance
				.setSize(CheckboxSize.Lg)
				.setChecked()
				.setDisabled()
				.setOnChange(() => {});

			assert.strictEqual(result, instance);
			assert.equal(instance.getSize(), CheckboxSize.Lg);
			assert.isTrue(instance.isChecked());
			assert.isTrue(instance.isDisabled());
		});
	});

	describe('attributes pass-through', () => {
		it('Passes custom HTML attributes to the input', () => {
			const input = new Checkbox({
				attributes: { id: 'my-cb', 'data-test': 'value', 'aria-label': 'Accept' },
			}).render().querySelector('input');

			assert.equal(input.getAttribute('id'), 'my-cb');
			assert.equal(input.getAttribute('data-test'), 'value');
			assert.equal(input.getAttribute('aria-label'), 'Accept');
		});

		it('Does not let custom attributes override reserved attributes', () => {
			const input = new Checkbox({
				checked: true,
				disabled: true,
				indeterminate: true,
				attributes: {
					type: 'text',
					class: 'my-class',
					checked: 'false',
					disabled: 'false',
					indeterminate: 'false',
				},
			}).render().querySelector('input');

			assert.equal(input.getAttribute('type'), 'checkbox');
			assert.isFalse(input.classList.contains('my-class'));
			assert.isTrue(input.classList.contains('ui-checkbox__input'));
			assert.isTrue(input.checked);
			assert.isTrue(input.disabled);
			assert.isTrue(input.indeterminate);
		});
	});

	describe('onChange', () => {
		it('Invokes onChange with the new checked value on user change', () => {
			let received = null;
			const input = new Checkbox({
				onChange: ({ checked }) => { received = checked; },
			}).render().querySelector('input');

			input.checked = true;
			input.dispatchEvent(new Event('change'));

			assert.isTrue(received);
		});

		it('User change clears the indeterminate state', () => {
			const instance = new Checkbox({ indeterminate: true });
			const input = instance.render().querySelector('input');

			input.checked = true;
			input.dispatchEvent(new Event('change'));

			assert.isFalse(instance.isIndeterminate());
			assert.isFalse(input.indeterminate);
		});

		it('Click on indeterminate forces checked=true regardless of prior state', () => {
			let received = null;
			const instance = new Checkbox({
				checked: true,
				indeterminate: true,
				onChange: ({ checked }) => { received = checked; },
			});
			const input = instance.render().querySelector('input');

			input.checked = false;
			input.dispatchEvent(new Event('change'));

			assert.isTrue(received);
			assert.isTrue(instance.isChecked());
			assert.isFalse(instance.isIndeterminate());
			assert.isTrue(input.checked);
		});

		it('setOnChange() replaces the callback at runtime', () => {
			const instance = new Checkbox({ onChange: () => { throw new Error('old'); } });
			const input = instance.render().querySelector('input');

			let received = null;
			instance.setOnChange(({ checked }) => { received = checked; });

			input.checked = true;
			input.dispatchEvent(new Event('change'));

			assert.isTrue(received);
		});
	});

	describe('destroy()', () => {
		it('Removes the wrapper from the DOM', () => {
			const instance = new Checkbox();
			const wrapper = instance.render();
			const parent = document.createElement('div');
			parent.append(wrapper);

			instance.destroy();

			assert.isNull(wrapper.parentNode);
		});

		it('Unbinds the change listener', () => {
			let calls = 0;
			const instance = new Checkbox({ onChange: () => { calls += 1; } });
			const input = instance.render().querySelector('input');

			instance.destroy();

			input.checked = true;
			input.dispatchEvent(new Event('change'));

			assert.equal(calls, 0);
		});

		it('Re-renders a fresh wrapper after destroy', () => {
			const instance = new Checkbox();
			const first = instance.render();

			instance.destroy();
			const second = instance.render();

			assert.notStrictEqual(first, second);
		});
	});
});
