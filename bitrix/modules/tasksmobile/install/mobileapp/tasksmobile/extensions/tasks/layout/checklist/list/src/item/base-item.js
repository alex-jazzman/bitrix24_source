/**
 * @module tasks/layout/checklist/list/src/item/base-item
 */
jn.define('tasks/layout/checklist/list/src/item/base-item', (require, exports, module) => {
	const { Loc } = require('loc');
	const { Random } = require('utils/random');
	const { debounce } = require('utils/function');
	const { ItemTextField } = require('tasks/layout/checklist/list/text-field');
	const { ChecklistItemView } = require('tasks/layout/checklist/list/src/layout/item-view');
	const { ItemPresenter } = require('tasks/layout/checklist/presenter');
	const { confirmDestructiveAction } = require('alert');

	const TITLE_DISPATCH_DELAY = 300;

	class BaseChecklistItem extends LayoutComponent
	{
		/** @param {BaseChecklistItemProps} props */
		constructor(props)
		{
			super(props);

			/** @type {ItemTextField | null} */
			this.textRef = null;
			/** @type {Object | null} */
			this.attachmentsRef = null;
			/** @type {string | null} */
			this.pendingTitle = null;

			this.flushTitle = this.flushTitle.bind(this);
			this.scheduleTitleDispatch = debounce(this.flushTitle, TITLE_DISPATCH_DELAY, this);

			this.handleOnBlur = this.handleOnBlur.bind(this);
			this.handleOnFocus = this.handleOnFocus.bind(this);
			this.handleOnChange = this.handleOnChange.bind(this);
			this.handleOnChangeTitle = this.handleOnChangeTitle.bind(this);
			this.handleOnSelectionStylesChange = this.handleOnSelectionStylesChange.bind(this);
			this.handleOnSubmit = this.handleOnSubmit.bind(this);
		}

		/**
		 * @protected
		 * @abstract
		 * @return {Object | null}
		 */
		render()
		{
			return null;
		}

		/**
		 * @protected
		 * @param {Object} itemProps
		 * @return {Object}
		 */
		renderContent(itemProps)
		{
			const { item } = this.props;

			return ChecklistItemView({
				testId: this.getTestId(`depth-${item.getDepth()}`),
				divider: !ItemPresenter.isFirstListDescendant(item),
				...itemProps,
			});
		}

		/**
		 * @protected
		 * @return {ItemTextField}
		 */
		renderTextField()
		{
			const { item, parentWidget, isFocused, showToastNoRights } = this.props;

			return new ItemTextField({
				ref: (ref) => {
					this.textRef = ref;
				},
				item,
				isFocused,
				parentWidget,
				showToastNoRights,
				enable: this.canUpdateItem(),
				placeholder: this.getPlaceholder(item),
				onBlur: this.handleOnBlur,
				onFocus: this.handleOnFocus,
				onSubmit: this.handleOnSubmit,
				onChangeText: this.handleOnChangeTitle,
				onSelectionStylesChange: this.handleOnSelectionStylesChange,
				...this.getTextFieldStyle(),
			});
		}

		/**
		 * @protected
		 * @abstract
		 * @return {Object}
		 */
		getTextFieldStyle()
		{
			return {};
		}

		/**
		 * @protected
		 * @abstract
		 * @param {ChecklistItemView} item
		 */
		getPlaceholder(item)
		{
			return '';
		}

		/**
		 * @param {string} title
		 * @param {boolean} [isFocused]
		 * @param {boolean} [shouldSave]
		 */
		handleOnChangeTitle(title, isFocused, shouldSave = true)
		{
			// while the field is focused it renders its own buffer, so the store may lag behind it.
			// A dispatch per character is expensive: the state-sync middleware deep-compares the whole
			// store and broadcasts the action to every JS context on each one.
			this.pendingTitle = title;
			this.scheduleTitleDispatch();

			// do not save during typing: reconciliation would overwrite the edited title
			this.handleOnChange(false);
		}

		/**
		 * Pushes the typed title into the store right away. Called before anything that reads the title
		 * from the store - a blur, a submit or a removal - and by the debounce in between.
		 *
		 * @return {void}
		 */
		flushTitle()
		{
			if (this.pendingTitle === null)
			{
				return;
			}

			const title = this.pendingTitle;
			this.pendingTitle = null;

			this.props.item.setTitle(title);
		}

		/** @param {boolean} [shouldSave] */
		handleOnChange(shouldSave)
		{
			const { onChange } = this.props;

			if (onChange)
			{
				onChange(shouldSave);
			}
		}

		/** @param {string[]} styles */
		handleOnSelectionStylesChange(styles)
		{
			const { onSelectionStylesChange } = this.props;

			if (onSelectionStylesChange)
			{
				onSelectionStylesChange(styles);
			}
		}

		/** @param {Object} [blurProps] */
		handleOnBlur(blurProps)
		{
			const { onBlur, item } = this.props;

			this.flushTitle();

			if (onBlur)
			{
				onBlur({ item });
			}
		}

		/** @return {void} */
		handleOnSubmit()
		{
			const { onSubmit, item } = this.props;

			this.flushTitle();

			if (onSubmit)
			{
				onSubmit(item);
			}
		}

		/** @return {void} */
		handleOnFocus()
		{
			const { item, onFocus } = this.props;

			if (onFocus)
			{
				onFocus(item);
			}
		}

		handleOnRemove = () => {
			const { item, onRemove, onBlur } = this.props;

			// the branch below asks the store whether the item has a title
			this.flushTitle();

			const removeAction = item.hasTitle() ? onRemove : onBlur;

			const remove = (forceDelete) => {
				if (removeAction)
				{
					removeAction({ item, forceDelete });
				}
			};

			if (!item.shouldRemove())
			{
				confirmDestructiveAction({
					title: '',
					description: Loc.getMessage('TASKSMOBILE_LAYOUT_CHECKLIST_REMOVE_ITEM'),
					onDestruct: () => {
						remove(true);
					},
				});

				return;
			}

			remove(true);
		};

		/** @return {void} */
		textInputFocus()
		{
			if (this.textRef)
			{
				this.textRef.focus();
			}
		}

		/** @return {void} */
		textInputBlur()
		{
			if (this.textRef)
			{
				this.textRef.blur();
			}
		}

		/** @return {void} */
		addFile()
		{
			this.attachmentsRef.addFile();
		}

		/** @param {'bold' | 'italic' | 'underline' | 'strikethrough'} type */
		applyTextFormat(type)
		{
			this.textRef?.applyFormat(type);
		}

		/**
		 * @param {string} [suffix]
		 * @return {string}
		 */
		getTestId(suffix)
		{
			const { item } = this.props;

			const prefix = `checklistItem_id-${item.getId()}`;

			return suffix ? `${prefix}_${suffix}` : prefix;
		}

		/**
		 * @param {number} additionalShift
		 * @return {number}
		 */
		getLeftShift(additionalShift = 0)
		{
			const { item } = this.props;

			return (item.getDepth() * 18) + additionalShift;
		}

		/** @return {string} */
		getTextValue()
		{
			return this.textRef.getTextValue().trim();
		}

		/**
		 * @param {boolean} [shouldSave]
		 * @param {boolean} [force]
		 * @return {boolean}
		 */
		syncTitleText(shouldSave = true, force = false)
		{
			// the close flow calls this instead of blurring the field, so the debounced title
			// has to be pushed out here as well
			this.flushTitle();

			return Boolean(this.textRef?.syncTextValue?.(shouldSave, force));
		}

		/** @return {void} */
		toggleCompleteText()
		{
			if (this.textRef)
			{
				this.textRef.toggleCompleted();
			}
		}

		/** @return {void} */
		reload()
		{
			this.setState({
				random: Random.getString(),
			});
		}

		/** @return {boolean} */
		canUpdateItem()
		{
			const { item } = this.props;

			return item.canEdit();
		}

		/** @return {boolean} */
		canRemoveItem()
		{
			const { item } = this.props;

			return item.canRemove();
		}
	}

	module.exports = { BaseChecklistItem };
});
