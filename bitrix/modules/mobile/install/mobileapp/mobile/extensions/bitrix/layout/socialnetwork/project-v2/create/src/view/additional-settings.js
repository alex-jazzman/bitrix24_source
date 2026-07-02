/**
 * @module layout/socialnetwork/project-v2/create/src/view/additional-settings
 */
jn.define('layout/socialnetwork/project-v2/create/src/view/additional-settings', (require, exports, module) => {
	const { Box } = require('ui-system/layout/box');
	const { Area } = require('ui-system/layout/area');
	const { AreaList } = require('ui-system/layout/area-list');
	const { DateTimeInput, InputSize, InputMode, InputDesign, DatePickerType, Icon: DateInputIcon } = require('ui-system/form/inputs/datetime');
	const { EntitySelectorFactory, EntitySelectorFactoryType } = require('selector/widget/factory');
	const { ChipStatus, ChipStatusDesign, ChipStatusMode } = require('ui-system/blocks/chips/chip-status');
	const { IconView, Icon } = require('ui-system/blocks/icon');
	const { requireLazy } = require('require-lazy');
	const { Color, Indent, Component } = require('tokens');
	const { Loc } = require('loc');
	const { Text2, Text5, Text4 } = require('ui-system/typography/text');
	const { createTestIdGenerator } = require('utils/test');

	const BORDER_WIDTH = 1;
	const BLOCK_BORDER_RADIUS = 12;
	const CHEVRON_SIZE = 24;

	class ProjectCreateAdditionalSettings extends LayoutComponent
	{
		constructor(props)
		{
			super(props);
			this.getTestId = createTestIdGenerator({
				prefix: 'project-create-additional',
				context: this,
			});
			this.autoDeleteMenuTargetRef = null;

			this.state = {
				dateStart: props.dateStart ?? 0,
				dateFinish: props.dateFinish ?? 0,
				tags: props.tags ?? [],
				messagesAutoDeleteDelay: props.messagesAutoDeleteDelay ?? 0,
			};
		}

		render()
		{
			return Box(
				{
					testId: this.getTestId(),
					resizableByKeyboard: true,
					onClick: this.#hideKeyboard,
				},
				AreaList(
					{
						testId: this.getTestId('area-list'),
						resizableByKeyboard: true,
						showsVerticalScrollIndicator: true,
					},
					Area(
						{
							isFirst: true,
							excludePaddingSide: {
								bottom: true,
							},
						},
						this.#renderDeadlinesBlock(),
					),
					Area(
						{
							excludePaddingSide: {
								bottom: true,
							},
						},
						this.#renderSelectorCard('tags', [
							this.#renderSettingItem({
								id: 'tags',
								title: Loc.getMessage('MOBILE_LAYOUT_PROJECT_V2_CREATE_TAGS_TITLE'),
								subtitle: this.#getTagsSubtitle(),
								onClick: this.#openTagsSelector,
								isLast: true,
							}),
						]),
					),
					this.props.showMessagesAutoDelete !== false && this.props.autoDeleteEnabledInPortalSettings && Area(
						{},
						this.#renderSelectorCard('messages-auto-delete', [
							this.#renderSettingItem({
								id: 'messages-auto-delete',
								title: Loc.getMessage('MOBILE_LAYOUT_PROJECT_V2_CREATE_AUTO_DELETE_TITLE'),
								rightContent: this.#renderAutoDeleteRightContent(),
								onClick: this.#openAutoDeletePopup,
								isLast: true,
								bindRef: this.#bindAutoDeleteMenuTargetRef,
							}),
						]),
					),
				),
			);
		}

		#renderSelectorCard(id, items)
		{
			return View(
				{
					testId: this.getTestId(`${id}-card`),
					style: {
						borderRadius: BLOCK_BORDER_RADIUS,
						borderWidth: 1,
						borderColor: Color.bgSeparatorPrimary.toHex(),
						backgroundColor: Color.bgContentPrimary.toHex(),
						overflow: 'hidden',
					},
				},
				...items.filter(Boolean),
			);
		}

		#renderDeadlinesBlock()
		{
			return View(
				{
					testId: this.getTestId('deadlines-block'),
				},
				this.#renderDeadlinesHeader(),
				this.#renderStartDateInput(),
				this.#renderFinishDateInput(),
			);
		}

		#renderDeadlinesHeader()
		{
			return View(
				{
					testId: this.getTestId('deadlines-header'),
					style: {
						flexDirection: 'row',
						alignItems: 'center',
						marginBottom: Indent.M.toNumber(),
					},
				},
				Text4({
					testId: this.getTestId('deadlines-title'),
					text: Loc.getMessage('MOBILE_LAYOUT_PROJECT_V2_CREATE_DEADLINES_TITLE'),
					color: Color.base4,
					style: {
						textTransform: 'uppercase',
					},
				}),
				IconView({
					testId: this.getTestId('deadlines-help-icon'),
					icon: Icon.QUESTION,
					size: 24,
					color: Color.base4,
					style: {
						marginLeft: Indent.XS.toNumber(),
					},
				}),
			);
		}

		#renderStartDateInput()
		{
			return View(
				{},
				DateTimeInput({
					testId: this.getTestId('date-start'),
					label: Loc.getMessage('MOBILE_LAYOUT_PROJECT_V2_CREATE_DATE_START_TITLE'),
					value: this.state.dateStart,
					size: InputSize.L,
					mode: InputMode.STROKE,
					design: InputDesign.LIGHT_GREY,
					rightStickContent: DateInputIcon.CALENDAR_WITH_SLOTS,
					parentWidget: this.props.layoutWidget,
					enableTime: false,
					datePickerType: DatePickerType.DATE,
					checkTimezoneOffset: false,
					copyingOnLongClick: true,
					onChange: this.#onDateStartChange,
					erase: true,
					onErase: this.#onDateStartErase,
				}),
			);
		}

		#renderFinishDateInput()
		{
			return View(
				{
					style: {
						marginTop: Indent.XL3.toNumber(),
					},
				},
				DateTimeInput({
					testId: this.getTestId('date-finish'),
					label: Loc.getMessage('MOBILE_LAYOUT_PROJECT_V2_CREATE_DATE_FINISH_TITLE'),
					value: this.state.dateFinish,
					size: InputSize.L,
					mode: InputMode.STROKE,
					design: InputDesign.LIGHT_GREY,
					rightStickContent: DateInputIcon.CALENDAR_WITH_SLOTS,
					parentWidget: this.props.layoutWidget,
					enableTime: false,
					datePickerType: DatePickerType.DATE,
					checkTimezoneOffset: false,
					copyingOnLongClick: true,
					onChange: this.#onDateFinishChange,
					erase: true,
					onErase: this.#onDateFinishErase,
				}),
			);
		}

		#onDateStartChange = (dateStart) => {
			this.#updateFields({ dateStart });
		};

		#onDateStartErase = () => {
			this.#updateFields({ dateStart: null });
		};

		#onDateFinishChange = (dateFinish) => {
			this.#updateFields({ dateFinish });
		};

		#onDateFinishErase = () => {
			this.#updateFields({ dateFinish: null });
		};

		#renderSettingItem({
			id,
			title,
			subtitle = null,
			rightContent = null,
			onClick,
			isLast = false,
			bindRef = null,
		})
		{
			return View(
				{
					ref: bindRef,
					testId: this.getTestId(`item-${id}`),
					style: {
						paddingHorizontal: Component.paddingLr.toNumber(),
						paddingVertical: Indent.XL.toNumber(),
					},
					onClick,
				},
				View(
					{
						style: {
							flexDirection: 'row',
							alignItems: 'center',
						},
					},
					View(
						{
							testId: this.getTestId(`item-${id}-content`),
							style: {
								flex: 1,
							},
						},
						Text2({
							testId: this.getTestId(`item-${id}-title`),
							text: title,
							color: Color.base1,
							style: {
								marginBottom: subtitle ? Indent.XS2.toNumber() : 0,
							},
						}),
						subtitle && Text5({
							testId: this.getTestId(`item-${id}-subtitle`),
							text: subtitle,
							color: Color.base3,
							numberOfLines: 2,
						}),
					),
					rightContent ?? this.#renderChevron(id),
				),
				!isLast && View({
					style: {
						position: 'absolute',
						left: Component.paddingLr.toNumber(),
						right: 0,
						bottom: 0,
						height: BORDER_WIDTH,
						backgroundColor: Color.bgSeparatorSecondary.toHex(),
					},
				}),
			);
		}

		#renderAutoDeleteRightContent()
		{
			return View(
				{
					testId: this.getTestId('auto-delete-right'),
					style: {
						flexDirection: 'row',
						alignItems: 'center',
						marginLeft: Indent.XL.toNumber(),
					},
				},
				ChipStatus({
					testId: this.getTestId('auto-delete-status'),
					text: this.#isAutoDeleteEnabled()
						? Loc.getMessage('MOBILE_LAYOUT_PROJECT_V2_CREATE_AUTO_DELETE_STATUS_ON')
						: Loc.getMessage('MOBILE_LAYOUT_PROJECT_V2_CREATE_AUTO_DELETE_STATUS_OFF'),
					design: this.#isAutoDeleteEnabled() ? ChipStatusDesign.SUCCESS : ChipStatusDesign.NEUTRAL,
					mode: ChipStatusMode.TINTED,
					compact: true,
				}),
				this.#renderChevron('messages-auto-delete'),
			);
		}

		#renderChevron(id)
		{
			return View(
				{
					testId: this.getTestId(`item-${id}-chevron-wrap`),
					style: {
						marginLeft: Indent.XL.toNumber(),
					},
				},
				IconView({
					testId: this.getTestId(`item-${id}-chevron`),
					icon: Icon.CHEVRON_TO_THE_RIGHT,
					color: Color.base4,
					size: CHEVRON_SIZE,
				}),
			);
		}

		#getTagsSubtitle()
		{
			return this.state.tags.length > 0
				? this.state.tags.join(', ')
				: Loc.getMessage('MOBILE_LAYOUT_PROJECT_V2_CREATE_ADDITIONAL_SELECT');
		}

		#isAutoDeleteEnabled()
		{
			return this.state.messagesAutoDeleteDelay !== 0;
		}

		#bindAutoDeleteMenuTargetRef = (ref) => {
			this.autoDeleteMenuTargetRef = ref;
		};

		#openAutoDeletePopup = async () => {
			try
			{
				const { MessagesAutoDeleteContextMenu } = await requireLazy(
					'im:messenger/lib/ui/context-menu/messages-auto-delete',
				);

				await MessagesAutoDeleteContextMenu.createByFileId({
					ref: this.autoDeleteMenuTargetRef,
					selectedItem: this.state.messagesAutoDeleteDelay,
					onItemSelected: (messagesAutoDeleteDelay) => this.#updateFields({ messagesAutoDeleteDelay }),
				}).open();
			}
			catch (error)
			{
				console.error(error);
			}
		};

		#openTagsSelector = async () => {
			const selector = EntitySelectorFactory.createByType(EntitySelectorFactoryType.PROJECT_TAG, {
				provider: {
					context: 'PROJECT_TAG',
					options: {
						groupId: Number(this.props.projectId ?? 0),
					},
				},
				createOptions: {
					enableCreation: true,
				},
				integrateSelectorToParentLayout: true,
				initSelectedIds: this.state.tags,
				allowMultipleSelection: true,
				closeOnSelect: false,
				events: {
					onClose: this.#onSelectTags,
				},
			});

			const selectorWidget = await this.props.layoutWidget?.openWidget('selector', {
				titleParams: {
					text: Loc.getMessage('MOBILE_LAYOUT_PROJECT_V2_CREATE_TAGS_TITLE'),
					type: 'dialog',
				},
				backdrop: {
					mediumPositionPercent: 90,
					horizontalSwipeAllowed: false,
				},
				sendButtonName: Loc.getMessage('MOBILE_LAYOUT_PROJECT_V2_CREATE_SELECTOR_SEND_BUTTON'),
			});

			if (!selectorWidget)
			{
				return;
			}

			await selector.show({}, selectorWidget);
		};

		#onSelectTags = (selectedTags = []) => {
			const tags = selectedTags
				.map((tag) => String(tag.id ?? tag.title ?? ''))
				.filter(Boolean);

			this.#updateFields({ tags });
		};

		#updateFields = (fields) => {
			this.setState(fields, () => {
				const changedFields = {
					dateStart: this.state.dateStart,
					dateFinish: this.state.dateFinish,
					tags: this.state.tags,
				};

				if (this.props.showMessagesAutoDelete !== false)
				{
					changedFields.messagesAutoDeleteDelay = this.state.messagesAutoDeleteDelay;
				}

				this.props.onChange?.(changedFields);
			});
		};

		#hideKeyboard = () => {
			Keyboard.dismiss();
		};
	}

	module.exports = {
		ProjectCreateAdditionalSettings: (props) => new ProjectCreateAdditionalSettings(props),
	};
});
