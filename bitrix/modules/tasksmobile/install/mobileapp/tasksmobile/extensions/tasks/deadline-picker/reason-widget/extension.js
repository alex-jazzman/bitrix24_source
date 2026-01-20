/**
 * @module tasks/deadline-picker/reason-widget
 */
jn.define('tasks/deadline-picker/reason-widget', (require, exports, module) => {
	const { Color, Indent } = require('tokens');
	const { Box, BoxFooter } = require('ui-system/layout/box');
	const { Button, ButtonSize } = require('ui-system/form/buttons/button');
	const {
		InputSize,
		InputDesign,
		InputMode,
		TextAreaInput,
	} = require('ui-system/form/inputs/textarea');
	const { BottomSheet } = require('bottom-sheet');
	const { Text4 } = require('ui-system/typography/text');
	const { H4 } = require('ui-system/typography/heading');
	const { Loc } = require('loc');

	const TITLE_HEIGHT = 44;
	const TEXT_AREA_HEIGHT = 140;
	const BOTTOM_SAFE_AREA_HEIGHT = 30;
	const TEXT_AREA_VERTICAL_PADDINGS_HEIGHT = Indent.M.toNumber() * 2;
	const INDENT_HEIGHT = Indent.L.toNumber();
	const BUTTON_SIZE = ButtonSize.L;

	class ReasonWidget extends LayoutComponent
	{
		constructor(props)
		{
			super(props);

			this.state = {
				reason: '',
				isError: false,
				subtitleHeight: 54,
			};

			this.onChangeReason = this.onChangeReason.bind(this);
			this.onSave = this.onSave.bind(this);
			this.onCancel = this.onCancel.bind(this);
		}

		show({ layout })
		{
			return new Promise((resolve, reject) => {
				this.resolve = resolve;
				this.reject = reject;

				const bottomSheet = new BottomSheet({ component: this });

				bottomSheet
					.setParentWidget(layout)
					.disableShowOnTop()
					.disableOnlyMediumPosition()
					.setMediumPositionHeight(this.getStartingLayoutHeight())
					.enableBounce()
					.disableSwipe()
					.disableHorizontalSwipe()
					.enableResizeContent()
					.enableAdoptHeightByKeyboard()
					.open()
					.then((widget) => {
						this.widget = widget;
					})
					.catch(reject);
			});
		}

		getStartingLayoutHeight()
		{
			return TITLE_HEIGHT
				+ this.state.subtitleHeight
				+ INDENT_HEIGHT
				+ TEXT_AREA_HEIGHT
				+ TEXT_AREA_VERTICAL_PADDINGS_HEIGHT
				+ BOTTOM_SAFE_AREA_HEIGHT
				+ BUTTON_SIZE.getHeight();
		}

		onChangeReason(reason)
		{
			this.setState({ reason, isError: false });
		}

		onSave()
		{
			const { reason } = this.state;
			const { onSave, canReasonBeEmpty } = this.props;

			const reasonTrimmed = reason.trim();

			if (reasonTrimmed.length === 0 && !canReasonBeEmpty)
			{
				this.setState({ reason: '', isError: true });

				return;
			}

			if (this.widget)
			{
				this.widget.close();
			}

			if (BX.type.isFunction(onSave))
			{
				onSave(reasonTrimmed);
			}

			if (this.resolve)
			{
				this.resolve(reasonTrimmed);
			}
		}

		onCancel()
		{
			const { onCancel } = this.props;

			if (this.widget)
			{
				this.widget.close();
			}

			if (BX.type.isFunction(onCancel))
			{
				onCancel();
			}

			if (this.reject)
			{
				this.reject();
			}
		}

		render()
		{
			return Box(
				{
					resizableByKeyboard: true,
					backgroundColor: Color.bgSecondary,
					safeArea: { bottom: true },
					footer: this.renderFooter(),
				},
				this.renderContent(),
			);
		}

		renderContent()
		{
			return View(
				{
					style: {
						paddingHorizontal: Indent.XL3.toNumber(),
					},
				},
				this.renderHeading(),
				this.renderDescription(),
				this.renderIndent(),
				this.renderInput(),
			);
		}

		renderHeading()
		{
			return H4({
				style: {
					height: TITLE_HEIGHT,
					paddingVertical: 0,
					textAlign: 'center',
				},
				text: Loc.getMessage('TASKSMOBILE_DEADLINE_PICKER_DEADLINE_CHANGE_REASON_TITLE'),
				color: Color.base1,
			});
		}

		renderDescription()
		{
			return Text4({
				style: {
					paddingVertical: 0,
				},
				text: Loc.getMessage('TASKSMOBILE_DEADLINE_PICKER_DEADLINE_CHANGE_REASON_DESCRIPTION'),
				color: Color.base4,
				onLayout: ({ height }) => {
					const roundedHeight = Math.round(height);
					if (this.state.subtitleHeight !== roundedHeight)
					{
						this.setState({ subtitleHeight: roundedHeight });
					}
				},
			});
		}

		renderIndent()
		{
			return View({
				style: {
					height: INDENT_HEIGHT,
				},
			});
		}

		renderInput()
		{
			const { reason, isError } = this.state;

			return TextAreaInput({
				testId: 'text-area-input-reason',
				value: reason,
				height: TEXT_AREA_HEIGHT,
				showCharacterCount: false,
				size: InputSize.L,
				design: InputDesign.GREY,
				mode: InputMode.STROKE,
				focus: true,
				enableLineBreak: true,
				keyboardType: 'default',
				onChange: this.onChangeReason,
				error: isError,
				onBlur: this.onCancel,
			});
		}

		renderFooter()
		{
			return BoxFooter(
				{
					safeArea: true,
					isShowKeyboard: true,
					keyboardButton: {
						text: Loc.getMessage('TASKSMOBILE_DEADLINE_PICKER_DEADLINE_CHANGE_REASON_BUTTON'),
						color: Color.baseWhiteFixed,
						onClick: this.onSave,
					},
				},
				Button({
					testId: 'BUTTON_SAVE',
					text: Loc.getMessage('TASKSMOBILE_DEADLINE_PICKER_DEADLINE_CHANGE_REASON_BUTTON'),
					stretched: true,
					size: BUTTON_SIZE,
					onClick: this.onSave,
				}),
			);
		}
	}

	module.exports = {
		ReasonWidget,
	};
});
