/**
 * @module timeman/layout/workday-intent-box-v3/src/shift-selection-slide
 */
jn.define('timeman/layout/workday-intent-box-v3/src/shift-selection-slide', (require, exports, module) => {
	const { PureComponent } = require('layout/pure-component');
	const { Box } = require('ui-system/layout/box');
	const { BoxFooter } = require('ui-system/layout/dialog-footer');
	const { Button, ButtonSize, ButtonDesign } = require('ui-system/form/buttons/button');
	const { CardList } = require('ui-system/layout/card-list');
	const { Card, CardCorner, CardDesign } = require('ui-system/layout/card');
	const { Checkbox } = require('ui-system/form/checkbox');
	const { H3 } = require('ui-system/typography/heading');
	const { Text3, Text4 } = require('ui-system/typography/text');
	const { IconView, Icon } = require('ui-system/blocks/icon');
	const { Color, Component, Indent } = require('tokens');
	const { Loc } = require('loc');
	const { Moment } = require('utils/date');
	const { shortTime, dayMonth } = require('utils/date/formats');
	const { PropTypes } = require('utils/validation');
	const { createTestIdGenerator } = require('utils/test');

	const HEADER_HEIGHT = 44;
	const ALL_SHIFTS_ID = 'all';

	class ShiftSelectionSlide extends PureComponent
	{
		constructor(props)
		{
			super(props);

			this.getTestId = createTestIdGenerator({
				context: this,
				prefix: 'shift-selection',
			});

			this.state = {
				selectedIds: new Set([ALL_SHIFTS_ID]),
			};
		}

		render()
		{
			return Box(
				{
					safeArea: {
						bottom: true,
					},
					footer: BoxFooter(
						{
							testId: this.getTestId('footer'),
						},
						Button({
							text: Loc.getMessage('TIMEMANMOBILE_SHIFT_SELECTION_BUTTON_SELECT'),
							size: ButtonSize.L,
							design: ButtonDesign.FILLED,
							stretched: true,
							testId: this.getTestId('select-button'),
							onClick: () => this.props.onSelect?.(this.#getSelectedShifts()),
						}),
					),
					testId: this.getTestId('container'),
				},
				View(
					{
						style: {
							flex: 1,
							marginHorizontal: Component.paddingLr.toNumber(),
						},
					},
					this.#renderHeader(),
					this.#renderDescription(),
					this.#renderShiftList(),
				),
			);
		}

		#renderHeader()
		{
			return View(
				{
					style: {
						height: HEADER_HEIGHT,
						justifyContent: 'center',
					},
				},
				IconView({
					style: {
						position: 'absolute',
					},
					icon: Icon.ARROW_TO_THE_LEFT,
					size: 28,
					color: Color.base4,
					testId: this.getTestId('back-button'),
					onClick: () => this.props.onBack?.(),
				}),
				H3({
					style: {
						textAlign: 'center',
					},
					text: Loc.getMessage('TIMEMANMOBILE_SHIFT_SELECTION_TITLE'),
					testId: this.getTestId('header-field'),
				}),
			);
		}

		#renderDescription()
		{
			return Text4({
				style: {
					marginTop: Indent.S.toNumber(),
					textAlign: 'center',
				},
				text: Loc.getMessage('TIMEMANMOBILE_SHIFT_SELECTION_DESCRIPTION'),
				testId: this.getTestId('description-field'),
			});
		}

		#renderShiftList()
		{
			return CardList(
				{
					style: {
						flex: 1,
						marginTop: Indent.XL4.toNumber(),
					},
					withScroll: true,
					showsVerticalScrollIndicator: false,
					divided: true,
					testId: this.getTestId('shift-list'),
				},
				...this.#getShiftItems().map((item) => this.#renderShiftCard(item)),
			);
		}

		#getShiftItems()
		{
			return [
				{
					id: ALL_SHIFTS_ID,
					label: Loc.getMessage('TIMEMANMOBILE_SHIFT_SELECTION_ALL_SHIFTS'),
				},
				...this.props.shifts.map((shift, index) => ({
					id: index,
					label: this.#formatShiftLabel(shift),
				})),
			];
		}

		#renderShiftCard(item)
		{
			const isSelected = this.#isSelected(item.id);
			const checkboxSize = 24;

			return Card(
				{
					border: !isSelected,
					corner: CardCorner.M,
					design: isSelected ? CardDesign.ACCENT : CardDesign.PRIMARY,
					testId: this.getTestId(`shift-card-${item.id}`),
					onClick: () => this.#toggleSelection(item.id),
				},
				View(
					{
						style: {
							flexDirection: 'row',
						},
					},
					Text3({
						style: {
							flex: 1,
							textAlign: 'center',
							marginLeft: checkboxSize,
						},
						text: item.label,
						color: Color.base1,
					}),
					new Checkbox({
						checked: isSelected,
						useState: false,
						size: checkboxSize,
						testId: this.getTestId(`shift-checkbox-${item.id}`),
					}),
				),
			);
		}

		#toggleSelection(id)
		{
			if (id === ALL_SHIFTS_ID)
			{
				this.setState({ selectedIds: new Set([ALL_SHIFTS_ID]) });

				return;
			}

			const selectedIds = new Set(this.state.selectedIds);
			selectedIds.delete(ALL_SHIFTS_ID);

			if (selectedIds.has(id))
			{
				selectedIds.delete(id);
			}
			else
			{
				selectedIds.add(id);
			}

			this.setState({ selectedIds: selectedIds.size > 0 ? selectedIds : new Set([ALL_SHIFTS_ID]) });
		}

		#isSelected(id)
		{
			return this.state.selectedIds.has(id);
		}

		#getSelectedShifts()
		{
			const { shifts } = this.props;

			if (this.#isSelected(ALL_SHIFTS_ID))
			{
				return shifts;
			}

			return [...this.state.selectedIds].map((id) => shifts[id]);
		}

		#formatShiftLabel(shift)
		{
			const momentStart = Moment.createFromTimestamp(shift.startTimestamp);
			const momentStop = Moment.createFromTimestamp(shift.stopTimestamp);

			return `${momentStart.format(dayMonth)} ${momentStart.format(shortTime)} - ${momentStop.format(shortTime)}`;
		}
	}

	ShiftSelectionSlide.propTypes = {
		shifts: PropTypes.arrayOf(
			PropTypes.shape({
				start: PropTypes.string.isRequired,
				stop: PropTypes.string.isRequired,
				startTimestamp: PropTypes.number.isRequired,
				stopTimestamp: PropTypes.number.isRequired,
				scheduleType: PropTypes.string.isRequired,
			}),
		).isRequired,
		onBack: PropTypes.func.isRequired,
		onSelect: PropTypes.func.isRequired,
		testId: PropTypes.string.isRequired,
	};

	module.exports = { ShiftSelectionSlide };
});
