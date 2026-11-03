/**
 * @module tasks/layout/checklist/list/src/item/main-item
 */
jn.define('tasks/layout/checklist/list/src/item/main-item', (require, exports, module) => {
	const { Loc } = require('loc');
	const { Haptics } = require('haptics');
	const { Indent, Typography } = require('tokens');
	const { ItemMembers } = require('tasks/layout/checklist/list/src/actions/members');
	const { ItemAttachments } = require('tasks/layout/checklist/list/src/actions/attachments');
	const { CheckBoxCounter } = require('tasks/layout/checklist/list/src/checkbox/checkbox-counter');
	const { ButtonRemove } = require('tasks/layout/checklist/list/src/buttons/button-remove');
	const { BaseChecklistItem } = require('tasks/layout/checklist/list/src/item/base-item');
	const { MEMBER_TYPE_RESTRICTION_FEATURE_META } = require('tasks/layout/checklist/list/src/constants');

	const LAYOUT_CHECKBOX_WIDTH = 34;
	const TEXT_FIELD_SIZE = 2;
	// The multiline text field keeps its own top inset, so a checkbox aligned to the top of the row
	// ends up above the first text line. Centering it inside a box of this height puts it on the line.
	const TEXT_FIELD_TOP_INSET = 4;
	const CHECKBOX_LINE_BOX_HEIGHT = (TEXT_FIELD_TOP_INSET * 2)
		+ Typography.getTokenBySize({ size: TEXT_FIELD_SIZE }).getDigitHeight();

	class MainChecklistItem extends BaseChecklistItem
	{
		/** @param {MainChecklistItemProps} props */
		constructor(props)
		{
			super(props);

			/** @type {CheckBoxCounter | null} */
			this.counterRef = null;
			/** @type {ButtonRemove | null} */
			this.buttonRemoveRef = null;
		}

		/** @return {Object} */
		render()
		{
			return this.renderContent({
				dividerShift: this.getLeftShift(LAYOUT_CHECKBOX_WIDTH),
				children: [
					View(
						{
							testId: 'checklist_entity_title',
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
							this.renderCheckbox(),
							this.renderTextField(),
							this.renderRemoveButton(),
						),
						this.renderActions(),
					),
				],
			});
		}

		/** @return {Object | null} */
		renderRemoveButton()
		{
			if (!this.canRemoveItem())
			{
				return null;
			}

			return new ButtonRemove({
				ref: (buttonRemoveRef) => {
					this.buttonRemoveRef = buttonRemoveRef;
				},
				onClick: this.handleOnRemove,
			});
		}

		/**
		 * @private
		 * @return {boolean}
		 */
		isShowActionRow()
		{
			const { item } = this.props;

			return item.hasMembers() || item.hasAttachments();
		}

		/**
		 * @private
		 * @return {Object}
		 */
		renderActions()
		{
			return View(
				{
					style: {
						display: this.isShowActionRow() ? 'flex' : 'none',
						marginTop: this.isShowActionRow() ? Indent.M.toNumber() : 0,
						flexDirection: 'row',
						marginLeft: this.getLeftShift(LAYOUT_CHECKBOX_WIDTH),
					},
				},
				this.#renderAttachments(),
				this.#renderMembers(),
			);
		}

		/**
		 * @private
		 * @return {Object}
		 */
		#renderMembers()
		{
			const { item, openUserSelectionManager, openTariffRestrictionWidget } = this.props;

			return new ItemMembers({
				item,
				testId: this.getTestId('users'),
				onClick: (itemId, memberType) => {
					if (MEMBER_TYPE_RESTRICTION_FEATURE_META[memberType].isRestricted())
					{
						openTariffRestrictionWidget(memberType);
					}
					else
					{
						openUserSelectionManager(itemId, memberType);
					}
				},
			});
		}

		/**
		 * @private
		 * @return {Object}
		 */
		#renderAttachments()
		{
			const { item, parentWidget, diskConfig, onChangeAttachments } = this.props;

			return new ItemAttachments({
				ref: (ref) => {
					this.attachmentsRef = ref;
				},
				testId: this.getTestId('file'),
				readOnly: !item.canEdit(),
				item,
				diskConfig,
				parentWidget,
				onChange: onChangeAttachments,
			});
		}

		/**
		 * @protected
		 * @param {ChecklistItemView} item
		 */
		getPlaceholder(item)
		{
			return Loc.getMessage('TASKSMOBILE_LAYOUT_ITEM_INPUT_PLACEHOLDER');
		}

		/**
		 * @private
		 * @return {Object}
		 */
		renderCheckbox()
		{
			const { item, showToastNoRights } = this.props;

			return View(
				{
					style: {
						flexDirection: 'row',
						marginRight: 6,
						marginLeft: this.getLeftShift(),
						height: CHECKBOX_LINE_BOX_HEIGHT,
						alignItems: 'center',
					},
				},
				new CheckBoxCounter({
					ref: this.#setRef,
					showToastNoRights,
					onClick: this.handleOnToggleComplete,
					checked: item.isComplete(),
					important: item.isImportant(),
					disabled: !item.canToggle(),
					totalCount: item.getChildrenCount(),
					completedCount: item.getCompletedChildrenCount(),
				}),
			);
		}

		/** @return {ChecklistTextFieldStyle} */
		getTextFieldStyle()
		{
			return {
				textSize: TEXT_FIELD_SIZE,
				header: false,
			};
		}

		/** @return {void} */
		handleOnToggleComplete = () => {
			const { item, onToggleComplete } = this.props;

			Haptics.impactLight();
			item.toggle();

			onToggleComplete(item);
		};

		/** @return {void} */
		handleOnBlur()
		{
			if (this.buttonRemoveRef)
			{
				this.buttonRemoveRef.hide();
			}

			super.handleOnBlur();
		}

		/** @return {void} */
		handleOnFocus()
		{
			const { item, updateMenu } = this.props;

			if (this.buttonRemoveRef)
			{
				this.buttonRemoveRef.show();
			}

			if (updateMenu)
			{
				updateMenu(item);
			}

			super.handleOnFocus(item);
		}

		/** @return {void} */
		handleOnSubmit()
		{
			if (this.getTextValue())
			{
				super.handleOnSubmit();
			}
			else
			{
				this.textInputBlur();
			}
		}

		/** @return {Promise<void>} */
		toggleImportant()
		{
			const { item } = this.props;

			// the caller decides whether to save by asking the store for a title
			this.flushTitle();

			item.setImportant(!item.isImportant());

			return this.counterRef.toggleAnimateImportant(item.isImportant());
		}

		#setRef = (ref) => {
			this.counterRef = ref;
		};
	}

	module.exports = { MainChecklistItem };
});
