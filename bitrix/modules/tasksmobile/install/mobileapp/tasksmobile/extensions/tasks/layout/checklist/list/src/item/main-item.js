/**
 * @module tasks/layout/checklist/list/src/item/main-item
 */
jn.define('tasks/layout/checklist/list/src/item/main-item', (require, exports, module) => {
	const { Loc } = require('loc');
	const { Haptics } = require('haptics');
	const { Indent } = require('tokens');
	const { ItemMembers } = require('tasks/layout/checklist/list/src/actions/members');
	const { ItemAttachments } = require('tasks/layout/checklist/list/src/actions/attachments');
	const { CheckBoxCounter } = require('tasks/layout/checklist/list/src/checkbox/checkbox-counter');
	const { ButtonRemove } = require('tasks/layout/checklist/list/src/buttons/button-remove');
	const { BaseChecklistItem } = require('tasks/layout/checklist/list/src/item/base-item');
	const { MEMBER_TYPE_RESTRICTION_FEATURE_META } = require('tasks/layout/checklist/list/src/constants');

	const LAYOUT_CHECKBOX_WIDTH = 34;

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

			return item.getMembersCount() > 0 || item.getAttachmentsCount() > 0;
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
				readOnly: !item.checkCanUpdate(),
				item,
				diskConfig,
				parentWidget,
				onChange: onChangeAttachments,
			});
		}

		/**
		 * @protected
		 * @param {CheckListFlatTreeItem} item
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
						alignItems: 'center',
					},
				},
				new CheckBoxCounter({
					ref: this.#setRef,
					showToastNoRights,
					onClick: this.handleOnToggleComplete,
					checked: item.getIsComplete(),
					important: item.getIsImportant(),
					disabled: !item.checkCanToggle(),
					totalCount: item.getTotalCount(),
					completedCount: item.getCompletedCount(),
				}),
			);
		}

		/** @return {ChecklistTextFieldStyle} */
		getTextFieldStyle()
		{
			return {
				textSize: 2,
				header: false,
			};
		}

		/** @return {void} */
		handleOnToggleComplete = () => {
			const { item, onToggleComplete } = this.props;

			Haptics.impactLight();
			item.toggleComplete();

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
			item.toggleImportant(!item.getIsImportant());

			return this.counterRef.toggleAnimateImportant(item.getIsImportant());
		}

		/** @param {string[]} members */
		setMembersToText(members)
		{
			const { item } = this.props;
			const itemTitle = item.getTitle().trim();
			const slicePosition = this.textRef?.getCursorPosition() ?? itemTitle.length;
			const startPosition = itemTitle.slice(0, slicePosition).trim();
			const endPosition = itemTitle.slice(slicePosition, itemTitle.length).trim();
			const title = `${startPosition} ${members.join(' ')} ${endPosition}`.trim();

			this.handleOnChangeTitle(title);
			this.toggleCompleteText();
		}

		/**
		 * @param {Object} progressParams
		 * @return {Promise<void>}
		 */
		updateProgress(progressParams)
		{
			if (!this.counterRef)
			{
				return Promise.resolve();
			}

			return this.counterRef.updateProgress(progressParams);
		}

		#setRef = (ref) => {
			this.counterRef = ref;
		};
	}

	module.exports = { MainChecklistItem };
});
