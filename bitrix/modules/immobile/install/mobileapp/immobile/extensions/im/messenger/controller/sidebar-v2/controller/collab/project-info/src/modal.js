/**
 * @module im/messenger/controller/sidebar-v2/controller/collab/project-info/src/modal
 */
jn.define('im/messenger/controller/sidebar-v2/controller/collab/project-info/src/modal', (require, exports, module) => {
	const { Type } = require('type');
	const { BottomSheet } = require('bottom-sheet');
	const { Color, Indent } = require('tokens');
	const { Text4, BBCodeText } = require('ui-system/typography');

	const { Loc } = require('im/messenger/controller/sidebar-v2/loc');
	const {
		ProjectInfoField,
		ProjectInfoDivider,
		ProjectInfoValue,
		ProjectInfoValueSkeleton,
		FIELD_LINE_HEIGHT,
		FIELD_GAP,
		LABEL_GAP,
		DIVIDER_HEIGHT,
	} = require('im/messenger/controller/sidebar-v2/controller/collab/project-info/src/fields');
	const {
		ProjectInfoTagsSection,
	} = require('im/messenger/controller/sidebar-v2/controller/collab/project-info/src/tags-section');
	const {
		splitTagsIntoRows,
	} = require('im/messenger/controller/sidebar-v2/controller/collab/project-info/src/tags-layout');
	const {
		getProjectInfoProps,
		subscribeToProjectInfo,
	} = require('im/messenger/controller/sidebar-v2/controller/collab/project-info/src/props');

	// Text4: the size every value of the sheet is read at, the description included.
	const DESCRIPTION_TEXT_SIZE = 4;

	// A description longer than this opens folded: the fields below it stay within reach of the
	// first screen instead of being pushed off by a text nobody asked to read in full yet.
	const DESCRIPTION_LINE_LIMIT = 6;

	const CONTENT_PADDING_HORIZONTAL = Indent.XL3.toNumber();
	const CONTENT_PADDING_BOTTOM = Indent.XL2.toNumber();
	const TAGS_GAP = Indent.S.toNumber();
	const TAG_ROW_HEIGHT = 28;

	// Average glyph width of Text4 (15px). Text cannot be measured before the layout pass, so both
	// the height the sheet opens at and the decision to fold the description are estimates. An
	// overestimated description shows a "show all" that unfolds into the same text; the content
	// scrolls and the sheet can be dragged up, so neither costs a hidden field.
	const CHARACTER_WIDTH = 8.3;

	// A sheet shorter than this reads as a glitch rather than a surface; a taller one hides the
	// panel it was opened from and should be dragged up by the reader instead. Kept in whole
	// percentages, the unit the sheet is opened in, so the bound is applied once and nowhere else.
	const MIN_HEIGHT_PERCENT = 30;
	const MAX_HEIGHT_PERCENT = 85;
	const DEFAULT_HEIGHT_PERCENT = 50;

	// The title bar of the sheet is part of the height the sheet is opened at, not of the content
	// laid out inside it.
	const TITLE_HEIGHT = 56;

	/**
	 * Everything the project says about itself, as four named fields parted by rules: the goal, the
	 * period, the description of the chat and the tags. A field nobody filled in says so in words -
	 * the sheet has the same four rows for every project, so what is missing is as legible as what
	 * is set.
	 *
	 * @extends {LayoutComponent<ProjectInfoModalProps, ProjectInfoModalState>}
	 */
	class ProjectInfoModal extends LayoutComponent
	{
		/**
		 * @param {ProjectInfoModalProps & { parentWidget?: LayoutWidget }} props
		 * @return {Promise}
		 */
		static open({ parentWidget, ...props })
		{
			const bottomSheet = new BottomSheet({
				component: (layoutWidget) => new ProjectInfoModal({ ...props, layoutWidget }),
			});

			bottomSheet
				.setParentWidget(parentWidget ?? PageManager)
				.setBackgroundColor(Color.bgSecondary.toHex())
				.setNavigationBarColor(Color.bgContentPrimary.toHex())
				.setMediumPositionPercent(estimateMediumPositionPercent(getProjectInfoProps(props)))
				.disableHorizontalSwipe()
				.enableSwipe()
				.setTitleParams({
					text: Loc.getMessage('IMMOBILE_SIDEBAR_V2_PROJECT_INFO_MODAL_TITLE'),
					type: 'dialog',
				});

			return bottomSheet.open();
		}

		/**
		 * @param {ProjectInfoModalProps} props
		 */
		constructor(props)
		{
			super(props);

			this.state = {
				descriptionExpanded: false,
				fields: getProjectInfoProps(this.props),
			};

			/** @type {?function(): void} */
			this.unsubscribe = null;
		}

		/**
		 * The sheet is a widget of its own: an answer that lands while it is open never reaches
		 * it through a redraw of the panel behind it, only through the store.
		 */
		componentDidMount()
		{
			this.unsubscribe = subscribeToProjectInfo(this.props, () => this.#refreshFields());
			this.#refreshFields();
		}

		componentWillUnmount()
		{
			this.unsubscribe?.();
			this.unsubscribe = null;
		}

		#refreshFields()
		{
			this.setState({ fields: getProjectInfoProps(this.props) });
		}

		/**
		 * @return {string}
		 */
		get goal()
		{
			return Type.isStringFilled(this.state.fields.goal) ? this.state.fields.goal : '';
		}

		/**
		 * Already formatted by formatProjectPeriod: an empty string means no date is set.
		 *
		 * @return {string}
		 */
		get period()
		{
			return Type.isStringFilled(this.state.fields.period) ? this.state.fields.period : '';
		}

		/**
		 * @return {string}
		 */
		get description()
		{
			return Type.isStringFilled(this.state.fields.description) ? this.state.fields.description : '';
		}

		/**
		 * @return {string[]}
		 */
		get tags()
		{
			return Type.isArrayFilled(this.state.fields.tags) ? this.state.fields.tags : [];
		}

		/**
		 * The sheet can be opened before the fields of the project have arrived: those rows wait
		 * with a skeleton instead of claiming the project has nothing in them.
		 *
		 * @return {boolean}
		 */
		get pending()
		{
			return this.state.fields.pending === true;
		}

		/**
		 * @return {boolean}
		 */
		get descriptionFolded()
		{
			return this.state.descriptionExpanded !== true
				&& estimateLineCount(this.description, this.contentWidth) > DESCRIPTION_LINE_LIMIT;
		}

		/**
		 * @return {number}
		 */
		get contentWidth()
		{
			return device.screen.width - (CONTENT_PADDING_HORIZONTAL * 2);
		}

		render()
		{
			return View(
				{
					testId: 'project-info-modal',
					safeArea: {
						bottom: true,
					},
					style: {
						flex: 1,
					},
				},
				ScrollView(
					{
						testId: 'project-info-modal-content',
						style: {
							flex: 1,
						},
						showsVerticalScrollIndicator: true,
					},
					View(
						{
							style: {
								paddingHorizontal: CONTENT_PADDING_HORIZONTAL,
								paddingBottom: CONTENT_PADDING_BOTTOM,
							},
						},
						this.#renderGoalField(),
						ProjectInfoDivider({ testId: 'project-info-divider-0' }),
						this.#renderPeriodField(),
						ProjectInfoDivider({ testId: 'project-info-divider-1' }),
						this.#renderDescriptionField(),
						ProjectInfoDivider({ testId: 'project-info-divider-2' }),
						this.#renderTagsField(),
					),
				),
			);
		}

		/**
		 * @return {object}
		 */
		#renderGoalField()
		{
			return ProjectInfoField(
				{
					label: Loc.getMessage('IMMOBILE_SIDEBAR_V2_PROJECT_INFO_SECTION_GOAL'),
					testId: 'project-info-goal',
				},
				this.pending
					? ProjectInfoValueSkeleton({ testId: 'project-info-goal-pending' })
					: ProjectInfoValue({
						testId: 'project-info-goal-value',
						value: this.goal,
						emptyText: Loc.getMessage('IMMOBILE_SIDEBAR_V2_PROJECT_INFO_GOAL_EMPTY'),
					}),
			);
		}

		/**
		 * @return {object}
		 */
		#renderPeriodField()
		{
			return ProjectInfoField(
				{
					label: Loc.getMessage('IMMOBILE_SIDEBAR_V2_PROJECT_INFO_DATES_LABEL'),
					testId: 'project-info-dates',
				},
				this.pending
					? ProjectInfoValueSkeleton({ testId: 'project-info-dates-pending' })
					: ProjectInfoValue({
						testId: 'project-info-dates-value',
						value: this.period,
						emptyText: Loc.getMessage('IMMOBILE_SIDEBAR_V2_PROJECT_INFO_DATES_EMPTY'),
					}),
			);
		}

		/**
		 * The description is the one of the chat, which is known without waiting for the project:
		 * it never shows a skeleton.
		 *
		 * @return {object}
		 */
		#renderDescriptionField()
		{
			return ProjectInfoField(
				{
					label: Loc.getMessage('IMMOBILE_SIDEBAR_V2_PROJECT_INFO_SECTION_DESCRIPTION'),
					testId: 'project-info-description',
				},
				// Spread, not an array: a list handed over as one child is a list the layer below
				// keeps nested, and a nested list draws nothing.
				...this.#renderDescriptionValue(),
			);
		}

		/**
		 * @return {object[]}
		 */
		#renderDescriptionValue()
		{
			const description = this.description;

			if (description === '')
			{
				return [
					ProjectInfoValue({
						testId: 'project-info-description-value',
						value: '',
						emptyText: Loc.getMessage('IMMOBILE_SIDEBAR_V2_PROJECT_INFO_DESCRIPTION_EMPTY'),
					}),
				];
			}

			const folded = this.descriptionFolded;

			return [
				BBCodeText({
					testId: 'project-info-description-value',
					value: description,
					size: DESCRIPTION_TEXT_SIZE,
					color: Color.base1,
					...(folded ? { numberOfLines: DESCRIPTION_LINE_LIMIT, ellipsize: 'end' } : {}),
				}),
				folded
					// The tap belongs to the container: a text node of this layout does not take
					// one of its own.
					? View(
						{
							testId: 'project-info-description-show-all',
							style: {
								alignSelf: 'flex-start',
								paddingTop: LABEL_GAP,
								paddingBottom: LABEL_GAP,
							},
							onClick: () => this.setState({ descriptionExpanded: true }),
						},
						Text4({
							testId: 'project-info-description-show-all-text',
							text: Loc.getMessage('IMMOBILE_SIDEBAR_V2_PROJECT_INFO_DESCRIPTION_SHOW_ALL'),
							color: Color.accentMainPrimary,
						}),
					)
					: null,
			].filter(Boolean);
		}

		/**
		 * @return {object}
		 */
		#renderTagsField()
		{
			return ProjectInfoField(
				{
					label: Loc.getMessage('IMMOBILE_SIDEBAR_V2_PROJECT_INFO_SECTION_TAGS'),
					testId: 'project-info-tags',
				},
				this.#renderTagsValue(),
			);
		}

		/**
		 * @return {object}
		 */
		#renderTagsValue()
		{
			if (this.pending)
			{
				return ProjectInfoValueSkeleton({ testId: 'project-info-tags-pending' });
			}

			const tags = this.tags;

			if (tags.length === 0)
			{
				return ProjectInfoValue({
					testId: 'project-info-tags-value',
					value: '',
					emptyText: Loc.getMessage('IMMOBILE_SIDEBAR_V2_PROJECT_INFO_TAGS_EMPTY'),
				});
			}

			return new ProjectInfoTagsSection({
				tags,
				availableWidth: this.contentWidth,
			});
		}
	}

	/**
	 * Lines a text takes on a row of the given width, counting the breaks it carries itself.
	 *
	 * @param {string} text
	 * @param {number} rowWidth
	 * @return {number}
	 */
	function estimateLineCount(text, rowWidth)
	{
		if (!Type.isStringFilled(text))
		{
			return 1;
		}

		const charactersPerLine = Math.max(1, Math.floor(rowWidth / CHARACTER_WIDTH));

		return text.split('\n').reduce(
			(lines, paragraph) => lines + Math.max(1, Math.ceil(paragraph.length / charactersPerLine)),
			0,
		);
	}

	/**
	 * The sheet is opened at a share of the screen, not at a height in points: the native layer
	 * lays out the height it is given as a percentage, and a sheet given one in points opens with
	 * nothing visible at all. Rounded up, because a share rounded down is a share the last field
	 * of the sheet pays for.
	 *
	 * @param {ProjectInfoModalProps} props
	 * @return {number} a whole percentage of the screen height
	 */
	function estimateMediumPositionPercent(props)
	{
		const percent = Math.ceil((estimateContentHeight(props) / device.screen.height) * 100);

		if (!Number.isFinite(percent))
		{
			return DEFAULT_HEIGHT_PERCENT;
		}

		return Math.min(Math.max(percent, MIN_HEIGHT_PERCENT), MAX_HEIGHT_PERCENT);
	}

	/**
	 * The height the sheet has to be given for all of its content to be read without a scroll,
	 * taken from the amount of text it was given: a project with four one-line fields should not
	 * open half a screen of white space, and a folded description should not open on its first two
	 * lines. Everything the sheet spends the height on is counted here - the title bar and the
	 * bottom inset included. Bounding it to a share of the screen is the job of
	 * estimateMediumPositionPercent.
	 *
	 * @param {ProjectInfoModalProps} props
	 * @return {number}
	 */
	function estimateContentHeight({ goal, period, description, tags })
	{
		const rowWidth = device.screen.width - (CONTENT_PADDING_HORIZONTAL * 2);
		const linesOf = (text) => estimateLineCount(text, rowWidth);
		// Label, its gap and the value: every field keeps its rows whether it is filled in or not.
		const fieldHeight = (lines) => (FIELD_GAP * 2) + FIELD_LINE_HEIGHT + LABEL_GAP + (lines * FIELD_LINE_HEIGHT);

		const descriptionLines = linesOf(description);
		const foldedLines = Math.min(descriptionLines, DESCRIPTION_LINE_LIMIT);
		// The row of the "show all" link is part of a folded description.
		const descriptionRows = descriptionLines > DESCRIPTION_LINE_LIMIT ? foldedLines + 1 : foldedLines;

		let height = TITLE_HEIGHT + bottomInset() + CONTENT_PADDING_BOTTOM + (DIVIDER_HEIGHT * 3);

		height += fieldHeight(linesOf(goal));
		height += fieldHeight(linesOf(period));
		height += fieldHeight(descriptionRows);

		if (Type.isArrayFilled(tags))
		{
			const rows = splitTagsIntoRows({
				tags,
				availableWidth: rowWidth,
				gap: TAGS_GAP,
			}).length;

			height += (FIELD_GAP * 2) + FIELD_LINE_HEIGHT + LABEL_GAP
				+ (rows * TAG_ROW_HEIGHT) + ((rows - 1) * TAGS_GAP);
		}
		else
		{
			height += fieldHeight(1);
		}

		return height;
	}

	/**
	 * The sheet lays its content inside the bottom safe area (see render), so the height it is
	 * opened at has to pay for that inset as well: without it the last field - the tags - opens
	 * under the home indicator on iOS. Android reports no inset, and nothing changes there.
	 *
	 * @return {number}
	 */
	function bottomInset()
	{
		return device.screen.safeArea?.bottom ?? 0;
	}

	module.exports = {
		ProjectInfoModal,
		estimateContentHeight,
		estimateMediumPositionPercent,
		estimateLineCount,
		DESCRIPTION_LINE_LIMIT,
		TITLE_HEIGHT,
	};
});
