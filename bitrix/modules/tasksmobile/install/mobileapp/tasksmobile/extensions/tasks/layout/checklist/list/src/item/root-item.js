/**
 * @module tasks/layout/checklist/list/src/item/root-item
 */
jn.define('tasks/layout/checklist/list/src/item/root-item', (require, exports, module) => {
	const { Loc } = require('loc');
	const { Indent, Color } = require('tokens');
	const { Text5 } = require('ui-system/typography/text');
	const { BaseChecklistItem } = require('tasks/layout/checklist/list/src/item/base-item');

	const FOCUS = 'focus';
	const BLUR = 'blur';

	class RootChecklistItem extends BaseChecklistItem
	{
		/** @param {RootChecklistItemProps} props */
		constructor(props)
		{
			super(props);

			const { item } = props;

			/** @type {string} */
			this.prevTitle = item.getTitle();
		}

		/** @return {Object} */
		render()
		{
			return this.renderContent({
				children: [
					View(
						{
							testId: 'checklist_root_title',
							style: {
								flexDirection: 'column',
							},
						},
						View(
							{
								style: {
									flexDirection: 'row',
									alignItems: 'flex-start',
								},
								onClick: () => {
									this.textInputFocus();
								},
							},
							this.renderTextField(),
						),
						this.renderDescription(),
					),
				],
			});
		}

		/** @return {Object} */
		renderDescription()
		{
			const { item } = this.props;
			const completedCount = item.getCompletedCount();
			const totalCount = item.getTotalCount();

			return View(
				{
					testId: 'checklist_items_count',
					style: {
						marginTop: Indent.S.toNumber(),
					},
				},
				Text5({
					style: {
						color: Color.base3.toHex(),
					},
					text: Loc.getMessage('TASKSMOBILE_LAYOUT_CHECKLIST_DONE_MSGVER_1', {
						'#COMPLETED#': completedCount,
						'#TOTAL#': totalCount,
					}),
				}),
			);
		}

		/** @return {ChecklistTextFieldStyle} */
		getTextFieldStyle()
		{
			return {
				textSize: 2,
				header: true,
			};
		}

		/**
		 * @protected
		 * @param {CheckListFlatTreeItem} item
		 */
		getPlaceholder(item)
		{
			return Loc.getMessage('TASKSMOBILE_LAYOUT_LIST_INPUT_PLACEHOLDER');
		}

		/** @return {void} */
		handleOnBlur()
		{
			const { item } = this.props;

			this.toggleChecklistRootTitle(item, BLUR);

			super.handleOnBlur();
		}

		/** @return {void} */
		handleOnFocus()
		{
			const { item, updateMenu } = this.props;

			this.toggleChecklistRootTitle(item, FOCUS);

			// Keep the bottom panel targeting the focused root title, same as MainChecklistItem.
			// Without this, BIUS actions are applied to a stale menu item instead of the root title.
			if (updateMenu)
			{
				updateMenu(item);
			}

			super.handleOnFocus(item);
		}

		/** @return {void} */
		handleOnSubmit()
		{
			const { item } = this.props;
			if (item.getTotalCount() > 0)
			{
				this.textInputBlur();

				return;
			}

			super.handleOnSubmit();
		}

		/**
		 * @param {string} title
		 * @param {boolean} [isFocused]
		 * @param {boolean} [shouldSave]
		 */
		handleOnChangeTitle(title, isFocused, shouldSave = true)
		{
			if (this.isDefaultChecklistTitle(this.#getPrevTitle()) && !title)
			{
				return;
			}

			super.handleOnChangeTitle(title, isFocused, shouldSave);
		}

		/**
		 * @param {CheckListFlatTreeItem} item
		 * @param {'focus' | 'blur'} action
		 */
		toggleChecklistRootTitle(item, action)
		{
			const title = item.getTitle();
			if (action === FOCUS && this.isDefaultChecklistTitle(item.getTitle()))
			{
				this.#setPrevTitle(title);
				this.#clearText(item);
			}
			else if (action === BLUR && !item.hasItemTitle())
			{
				item.setTitle(this.#getPrevTitle());
				this.toggleCompleteText();
			}
		}

		/**
		 * @param {string} value
		 * @return {boolean}
		 */
		isDefaultChecklistTitle(value)
		{
			const regex = new RegExp(`^${Loc.getMessage('TASKSMOBILE_LAYOUT_CHECKLIST_STUB_TEXT').toLowerCase()}(\\s\\d+)?$`);

			return regex.test(value.trim().toLowerCase());
		}

		/**
		 * @private
		 * @param {CheckListFlatTreeItem} item
		 */
		#clearText(item)
		{
			if (item.getTitle())
			{
				item.setTitle('');
				this.textRef.clear();
			}
		}

		/**
		 * @private
		 * @return {string}
		 */
		#getPrevTitle()
		{
			return this.prevTitle;
		}

		/**
		 * @private
		 * @param {string} title
		 */
		#setPrevTitle(title)
		{
			this.prevTitle = title;
		}
	}

	module.exports = { RootChecklistItem };
});
