(() => {
	const require = (ext) => jn.require(ext);

	const { describe, test, expect } = require('testing');
	const { ItemTextField } = require('tasks/layout/checklist/list/src/text-field');

	const createItem = (title) => ({
		getTitle: () => title,
		getIsComplete: () => false,
		hasItemTitle: () => true,
		getIndex: () => 0,
	});

	describe('tasks:checklist/text-field', () => {
		test('should cache the raw BBCode source delivered by native onChangeText', () => {
			let changedText = null;

			const field = new ItemTextField({
				item: createItem('[s]Тест[/s]'),
				onChangeText: (text) => {
					changedText = text;
				},
			});

			field.textInputRef = { isFocused: () => true };

			// Native TextInput (showBBCode: false) emits the raw source, not plain text.
			field.handleOnChange('[s]Тест новое[/s]');

			expect(changedText).toEqual('[s]Тест новое[/s]');
			expect(field.getTextValue()).toEqual('[s]Тест новое[/s]');
		});

		test('should ignore onChangeText when the value did not change', () => {
			let changedCount = 0;

			const field = new ItemTextField({
				item: createItem('[s]Тест[/s]'),
				onChangeText: () => {
					changedCount++;
				},
			});

			field.textInputRef = { isFocused: () => true };

			field.handleOnChange('[s]Тест[/s]');

			expect(changedCount).toBe(0);
			expect(field.getTextValue()).toEqual('[s]Тест[/s]');
		});

		test('should wrap the selected text into a BBCode tag on formatting action', () => {
			let applyItalicCount = 0;
			let changedText = null;

			const field = new ItemTextField({
				item: createItem('Тест'),
				onChangeText: (text) => {
					changedText = text;
				},
			});

			field.textInputRef = {
				applyItalic: () => {
					applyItalicCount++;
				},
				isFocused: () => true,
			};

			field.handleOnSelectionChange({ selection: { start: 0, end: 4 } });
			field.applyFormat('italic');

			expect(applyItalicCount).toBe(1);
			expect(changedText).toEqual('[i]Тест[/i]');
		});

		test('should remove the BBCode tag when the whole selection is already formatted', () => {
			let changedText = null;

			const field = new ItemTextField({
				item: createItem('[i]Тест[/i]'),
				onChangeText: (text) => {
					changedText = text;
				},
			});

			field.textInputRef = {
				applyItalic: () => {},
				isFocused: () => true,
			};

			field.handleOnSelectionChange({ selection: { start: 0, end: 4 } });
			field.applyFormat('italic');

			expect(changedText).toEqual('Тест');
		});

		test('should not change the source when there is no selection', () => {
			let changedText = null;

			const field = new ItemTextField({
				item: createItem('Тест'),
				onChangeText: (text) => {
					changedText = text;
				},
			});

			field.textInputRef = {
				applyBold: () => {},
				isFocused: () => true,
			};

			field.handleOnSelectionChange({ selection: { start: 2, end: 2 } });
			field.applyFormat('bold');

			expect(changedText).toBeNull();
			expect(field.getTextValue()).toEqual('Тест');
		});

		test('syncTextValue is a no-op because the model is kept current by onChangeText', () => {
			const field = new ItemTextField({
				item: createItem('[s]Тест[/s]'),
				onChangeText: () => {},
			});

			expect(field.syncTextValue()).toBe(false);
			expect(field.getTextValue()).toEqual('[s]Тест[/s]');
		});
	});
})();
