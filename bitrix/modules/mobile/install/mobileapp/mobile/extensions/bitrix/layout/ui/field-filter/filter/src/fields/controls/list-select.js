/**
 * @module layout/ui/field-filter/filter/src/fields/controls/list-select
 */
jn.define('layout/ui/field-filter/filter/src/fields/controls/list-select', (require, exports, module) => {
	const { Type } = require('type');
	const { PureComponent } = require('layout/pure-component');
	const { createTestIdGenerator } = require('utils/test');
	const { useCallback } = require('utils/function');
	const { SelectableRow } = require('layout/ui/field-filter/filter/src/layout/selectable-row');
	const { getAnyText } = require('layout/ui/field-filter/filter/src/model/value-formatter');

	/**
	 * Value list of a picker: rows with a check on the selected ones (BXML `SettingsCell mode="icon"`).
	 * The first row resets the field, so "not set" is choosable and not only reachable by
	 * unchecking everything.
	 *
	 * @extends {PureComponent<ListSelectControlProps>}
	 */
	class ListSelectControl extends PureComponent
	{
		/**
		 * @param {ListSelectControlProps} props
		 */
		constructor(props)
		{
			super(props);

			this.getTestId = createTestIdGenerator({ context: this, prefix: 'list' });
		}

		getItems()
		{
			const { items } = this.props;

			return Type.isArrayFilled(items) ? items : [];
		}

		getSelectedIds()
		{
			const { value } = this.props;

			if (Type.isArray(value))
			{
				return value;
			}

			return Type.isStringFilled(value) ? [value] : [];
		}

		isSelected(id)
		{
			return this.getSelectedIds().includes(id);
		}

		select(id)
		{
			const { multiple, onChange } = this.props;

			if (!multiple)
			{
				onChange?.(id);

				return;
			}

			const selected = this.getSelectedIds();
			const next = this.isSelected(id)
				? selected.filter((selectedId) => selectedId !== id)
				: [...selected, id];

			onChange?.(next);
		}

		/**
		 * The rows are pure, so the reset row keeps one handler across renders: a function built in
		 * render is a changed prop.
		 */
		reset = () => {
			const { multiple, onChange } = this.props;

			onChange?.(multiple ? [] : null);
		};

		render()
		{
			const items = this.getItems();
			const selected = new Set(this.getSelectedIds());

			return View(
				{
					testId: this.getTestId(),
					style: { flexDirection: 'column' },
				},
				this.renderRow({
					id: 'any',
					text: getAnyText(),
					selected: selected.size === 0,
					// a dictionary the server sent empty leaves this row the last one, and the last row
					// of a list carries no hairline under it
					isLast: items.length === 0,
					onClick: this.reset,
				}),
				...items.map((item, index) => this.renderRow({
					id: item.id,
					text: item.value,
					selected: selected.has(item.id),
					isLast: index === items.length - 1,
					onClick: useCallback(() => this.select(item.id), [item.id]),
				})),
			);
		}

		renderRow({ id, text, selected, isLast = false, onClick })
		{
			return SelectableRow({
				testId: this.getTestId(id),
				title: text,
				selected,
				divider: !isLast,
				onClick,
			});
		}
	}

	module.exports = { ListSelectControl };
});
