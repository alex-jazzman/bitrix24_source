/**
 * @module timeman/work-reports/ui/form
 */
jn.define('timeman/work-reports/ui/form', (require, exports, module) => {
	const { Area } = require('ui-system/layout/area');
	const { AreaList } = require('ui-system/layout/area-list');
	const { Box } = require('ui-system/layout/box');
	const { BoxFooter } = require('ui-system/layout/dialog-footer');
	const { Button, ButtonDesign, ButtonSize } = require('ui-system/form/buttons/button');
	const { ChipButton, ChipButtonDesign, ChipButtonMode } = require('ui-system/blocks/chips/chip-button');
	const { Text4 } = require('ui-system/typography/text');
	const { Icon } = require('assets/icons');
	const { Indent, Color, Corner } = require('tokens');
	const { H3 } = require('ui-system/typography/heading');
	const { Loc } = require('timeman/work-reports/loc');
	const { FORM_TITLE_HEIGHT, TEXT_AREA_HEIGHT } = require('timeman/work-reports/ui/form/src/heights');
	const { GptReportCard, GPT_CARD_HEIGHT, ROBOT_CARD_HEIGHT } = require('timeman/work-reports/ui/gpt-report-card');
	const { MapCard, MAP_HEIGHT } = require('timeman/work-reports/ui/map-card');
	const { PureComponent } = require('layout/pure-component');
	const { TextAreaInput, InputSize, InputDesign } = require('ui-system/form/inputs/textarea');
	const { createTestIdGenerator } = require('utils/test');
	const { debounce } = require('utils/function');

	class WorkReportForm extends PureComponent
	{
		/**
		 * @param {ContentHeightOptions} [options]
		 * @returns {number}
		 */
		static getContentHeight({ hasAutoReport = false, hasGpt = false, hasMap = false } = {})
		{
			const elementSpacing = Indent.XL3.toNumber();
			const formTitle = FORM_TITLE_HEIGHT + elementSpacing;
			const boxFooter = 66;

			let height = TEXT_AREA_HEIGHT + elementSpacing + boxFooter + formTitle;

			if (hasAutoReport || hasGpt)
			{
				const autoReportHeight = hasGpt ? GPT_CARD_HEIGHT : ROBOT_CARD_HEIGHT;
				height += autoReportHeight + elementSpacing;
			}

			if (hasMap)
			{
				height += MAP_HEIGHT + elementSpacing;
			}

			return height;
		}

		/**
		 * @param {WorkReportFormProps} props
		 */
		constructor(props)
		{
			super(props);

			this.state = {
				report: props.report ?? null,
				hasText: Boolean(props.report?.length),
				saving: false,
			};

			this.inputRef = null;
			this.scrollRef = null;
			this.getTestId = createTestIdGenerator({ context: this });
		}

		// Guards re-entry synchronously: `saving` lands only after setState, so two quick taps
		// would both get through a state-based check.
		#submitting = false;

		#onClickButton = async () => {
			if (this.#submitting)
			{
				return;
			}

			this.#submitting = true;

			const { onClick } = this.props;
			const { report } = this.state;

			this.inputRef?.blur();

			this.setState({ saving: true }, async () => {
				try
				{
					await onClick?.({ report });
				}
				finally
				{
					this.#submitting = false;
					this.setState({ saving: false });
				}
			});
		};

		#onChangeReport = (report) => {
			this.props.onReportChange?.(report);

			const hasText = Boolean(report?.length);
			if (hasText !== this.state.hasText)
			{
				this.setState({ hasText, report });
			}

			this.#commitReport(report);
		};

		#commitReport = debounce((report) => {
			this.setState({ report });
		}, 300);

		#onEraseReport = () => {
			this.props.onReportChange?.(null);

			this.inputRef.clear();
			this.setState({ report: null, hasText: false });
		};

		#bindInputRef = (ref) => {
			this.inputRef = ref;
		};

		#onFocusTextArea = () => {
			this.scrollRef?.scrollToEnd?.({ animated: true });
		};

		render()
		{
			const { readOnly, hasAutoReport, hasGpt } = this.props;

			return Box(
				{
					testId: this.getTestId('box'),
					resizableByKeyboard: true,
					withScroll: hasAutoReport || hasGpt || readOnly,
					withPaddingHorizontal: true,
					footer: readOnly ? null : this.#renderFooter(),
					safeArea: {
						bottom: !readOnly,
					},
					scrollProps: {
						ref: (ref) => {
							this.scrollRef = ref;
						},
					},
					onClick: () => {
						this.inputRef?.blur();
					},
				},
				AreaList(
					{
						testId: this.getTestId('day-summary-content'),
						withScroll: false,
						safeArea: {
							bottom: false,
						},
					},
					Area(
						{
							isFirst: true,
						},
						this.#renderFormTitle(),
						this.#renderGptReport(),
						this.#renderMapCard(),
						this.#renderReportTextArea(),
						this.#renderChipsPanel(),
					),
				),
			);
		}

		#renderFooter = () => {
			const { buttonText } = this.props;
			const { saving } = this.state;
			const submitButtonBase = {
				text: buttonText ?? Loc.getMessage('M_TIMEMAN_DAILY_REPORT_SAVE_BUTTON'),
				loading: saving,
				onClick: this.#onClickButton,
			};

			return BoxFooter(
				{
					testId: this.getTestId('footer'),
					style: {
						backgroundColor: Color.bgPrimary.toHex(),
					},
					keyboardButton: {
						...submitButtonBase,
					},
				},
				Button({
					testId: this.getTestId('submit-button'),
					design: ButtonDesign.OUTLINE_ACCENT_1,
					size: ButtonSize.L,
					stretched: true,
					...submitButtonBase,
				}),
			);
		};

		#renderFormTitle()
		{
			const { formTitle } = this.props;

			if (!formTitle)
			{
				return null;
			}

			return H3({
				testId: this.getTestId('form-title'),
				text: formTitle,
				style: {
					minHeight: FORM_TITLE_HEIGHT,
					textAlign: 'center',
					marginBottom: Indent.XL3.toNumber(),
				},
			});
		}

		#renderMapCard()
		{
			const { dateReport, checkInCount, snapshotUrl } = this.props;

			if (!checkInCount)
			{
				return null;
			}

			return View(
				{
					style: {
						marginBottom: Indent.XL3.toNumber(),
					},
				},
				new MapCard({ timeReport: dateReport, checkInCount, snapshotUrl, testId: this.getTestId }),
			);
		}

		#renderGptReport()
		{
			const { gptReport, hasGpt, hasAutoReport, period, reportTitle, dateReport } = this.props;
			if (!hasAutoReport && !hasGpt)
			{
				return null;
			}

			return new GptReportCard({
				testId: this.getTestId('gpt-report'),
				report: gptReport,
				period,
				title: reportTitle,
				hasAutoReport,
				hasGpt,
				dateReport,
				style: {
					marginBottom: Indent.XL3.toNumber(),
				},
			});
		}

		#renderReportTextArea()
		{
			const { report, hasText } = this.state;
			const { readOnly } = this.props;

			if (readOnly)
			{
				return hasText && View(
					{
						style: {
							backgroundColor: Color.base7.toHex(),
							borderRadius: Corner.M.toNumber(),
							padding: Indent.XL.toNumber(),
						},
					},
					Text4({
						text: report,
						color: Color.base1,
					}),
				);
			}

			return View(
				{
					interactable: true,
				},
				TextAreaInput({
					testId: this.getTestId('report'),
					ref: this.#bindInputRef,
					height: TEXT_AREA_HEIGHT,
					showCharacterCount: false,
					size: InputSize.L,
					design: InputDesign.LIGHT_GREY,
					onFocus: this.#onFocusTextArea,
					onChange: this.#onChangeReport,
					onErase: this.#onEraseReport,
					value: report,
					erase: hasText,
					placeholder: Loc.getMessage('M_TIMEMAN_DAILY_REPORT_COMMENT_PLACEHOLDER'),
					multiline: true,
					style: {
						marginBottom: Indent.XL3.toNumber(),
					},
				}),
			);
		}

		#renderChipsPanel()
		{
			const { recipientName } = this.props;

			if (!recipientName)
			{
				return null;
			}

			return ChipButton({
				testId: this.getTestId(`recipient-${recipientName ? 'selected' : 'empty'}`),
				mode: ChipButtonMode.OUTLINE,
				design: recipientName ? ChipButtonDesign.PRIMARY : ChipButtonDesign.GREY,
				text: recipientName ?? Loc.getMessage('M_TIMEMAN_DAILY_REPORT_RECIPIENT_PLACEHOLDER'),
				icon: Icon.PERSON,
				compact: false,
				rounded: false,
				style: {
					flexGrow: 1,
					flexShrink: 1,
					marginRight: 8,
				},
			});
		}
	}

	module.exports = { WorkReportForm, FORM_TITLE_HEIGHT, TEXT_AREA_HEIGHT };
});
