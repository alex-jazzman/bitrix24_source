/**
 * @module layout/ui/field-filter/filter/src/saved-filters/section
 */
jn.define('layout/ui/field-filter/filter/src/saved-filters/section', (require, exports, module) => {
	const { Loc } = require('loc');
	const { Type } = require('type');
	const { SavedFilterBuilder } = require('layout/ui/field-filter/filter/src/saved-filters/builder');
	const { SavedFiltersEdit } = require('layout/ui/field-filter/filter/src/saved-filters/edit');
	const { Indent } = require('tokens');
	const { showErrorToast } = require('toast');
	const { PureComponent } = require('layout/pure-component');
	const { createTestIdGenerator } = require('utils/test');
	const { useCallback } = require('utils/function');
	const { Icon } = require('ui-system/blocks/icon');
	const { IconAction, getHitOverhang } = require('layout/ui/field-filter/filter/src/layout/icon-action');
	const {
		ChipButton,
		ChipButtonMode,
		ChipButtonSize,
		ChipButtonDesign,
	} = require('ui-system/blocks/chips/chip-button');
	const { Line } = require('utils/skeleton');
	const { FilterSection, ROW_PADDING } = require('layout/ui/field-filter/filter/src/layout/section');

	/**
	 * `flexWrap` has no gap of its own, so the gap of the strip (BXML `Box gap="m"`) lives on the
	 * chips and works on both axes at once.
	 * @type {number}
	 */
	const CHIP_GAP = Indent.M.toNumber();

	/**
	 * The gap belongs to every chip on both axes, the create chip included: a chip without the
	 * right margin would eat the side padding compensated on the strip.
	 * @type {{ marginRight: number, marginBottom: number }}
	 */
	const CHIP_STYLE = {
		marginRight: CHIP_GAP,
		marginBottom: CHIP_GAP,
	};

	/**
	 * Widths of the chips the wait draws in place of the presets: saved filters are named by hand,
	 * so a strip of equal blocks reads as a control and not as a list on its way. Four of them -
	 * as many as a portal has presets more often than not, and enough to fill the line.
	 * @type {number[]}
	 */
	const SHIMMER_CHIP_WIDTHS = [104, 72, 128, 88];

	/**
	 * "Saved filters" section of the drawer: presets wrapped over lines, a "create filter"
	 * chip after them and the gear that opens the edit mode. The preset order is the server
	 * one - CONTRACT-API-02 has no reorder action.
	 *
	 * Presets wrap instead of scrolling in one row: a single row cuts off the create chip.
	 *
	 * @extends {PureComponent<SavedFiltersSectionProps, SavedFiltersSectionState>}
	 */
	class SavedFiltersSection extends PureComponent
	{
		/**
		 * @param {SavedFiltersSectionProps} props
		 */
		constructor(props)
		{
			super(props);

			this.getTestId = createTestIdGenerator({ context: this, prefix: 'saved-filters' });

			// the list and the selected preset live in the filter and arrive as props: the section is
			// pure, so a selection it reads out of the filter itself is a selection its owner cannot
			// repaint. Nothing is copied into the state - the filter stays the single writer.
			this.state = { loading: !props.filter.arePresetsLoaded() };

			// the gear and the create chip are pure, so they get the same handler on every render
			this.openEditMode = this.openEditMode.bind(this);
			this.openBuilder = this.openBuilder.bind(this);
			this.handleChange = this.handleChange.bind(this);
		}

		componentDidMount()
		{
			void this.reload();
		}

		async reload()
		{
			const result = await this.props.service.load();

			if (!result.success)
			{
				showErrorToast({ message: result.message });
				this.setState({ loading: false });

				return;
			}

			// the selected preset is not read out of the answer: the section is built anew on every
			// open of the drawer, while the server pointer only moves when a preset is saved or
			// pinned. Reading it here dropped the preset picked during the session back to the
			// pinned one as soon as the drawer was reopened
			this.props.filter.setSavedFilters(result.data);
			this.handleChange();
		}

		/**
		 * The strip is drawn from the props of this section, so the drawer is told that the list it
		 * hands down has changed: a list put into the store alone would not reach the screen.
		 */
		handleChange()
		{
			this.setState({ loading: false });
			this.props.onChange?.();
		}

		/**
		 * Tapping the selected preset drops the selection and clears the form.
		 *
		 * @param {SavedFilter} preset
		 */
		selectPreset(preset)
		{
			const { filter } = this.props;

			if (filter.getCurrentFilterId() === preset.id)
			{
				// dropping the selection, not resetting: a reset goes back to the pinned preset, and
				// tapping the pinned one would then leave it selected forever
				filter.clear();
			}
			else
			{
				filter.applyPreset(preset);
			}

			this.handleChange();
		}

		openBuilder()
		{
			const { filter, service, parentWidget } = this.props;

			void SavedFilterBuilder.open({
				filter,
				service,
				parentWidget,
				onSaved: (preset) => this.applySavedPreset(preset),
				onChanged: this.handleChange,
			});
		}

		/**
		 * `saveFilter` makes the preset the current one on the server, so the form is filled from it
		 * as well: the builder composes conditions of its own, and a selected chip must not promise
		 * conditions the form does not hold.
		 *
		 * The preset itself comes from the builder, which has already put it into the store - the
		 * list is not read again to look it up there.
		 *
		 * @param {SavedFilter} preset
		 */
		applySavedPreset(preset)
		{
			this.props.filter.applyPreset(preset);
			this.handleChange();
		}

		openEditMode()
		{
			const { filter, service, parentWidget } = this.props;

			void SavedFiltersEdit.open({
				filter,
				service,
				parentWidget,
				// the edit screen writes into the same store this strip is drawn from, so it only
				// has to say that something has changed
				onChanged: this.handleChange,
			});
		}

		/**
		 * The list the strip is drawn from.
		 *
		 * @return {SavedFilter[]}
		 */
		getPresets()
		{
			return Type.isArray(this.props.presets) ? this.props.presets : [];
		}

		/**
		 * @param {SavedFilter} preset
		 * @return {boolean}
		 */
		isPresetSelected(preset)
		{
			return this.props.currentFilterId === preset.id;
		}

		render()
		{
			const { isFirst } = this.props;

			return FilterSection(
				{
					testId: this.getTestId(),
					title: Loc.getMessage('M_FIELD_FILTER_SAVED_TITLE'),
					titleAction: this.renderEditIcon(),
					isFirst,
				},
				this.state.loading ? this.renderShimmer() : this.renderRow(),
			);
		}

		renderEditIcon()
		{
			if (this.getPresets().length === 0)
			{
				return null;
			}

			return IconAction({
				testId: this.getTestId('edit'),
				icon: Icon.SETTINGS,
				// the gear stands alone in the title row, so its area grows into the padding of that
				// row as well: nothing above or below it answers a tap of its own
				verticalOverhang: getHitOverhang(),
				marginRight: -getHitOverhang(),
				onClick: this.openEditMode,
			});
		}

		renderRow()
		{
			return this.renderStrip(
				this.getTestId('row'),
				...this.getPresets().map((preset, index) => this.renderPresetChip(preset, index)),
				this.renderCreateChip(),
			);
		}

		/**
		 * The wait for the presets: chip-shaped blocks standing on the metrics of the strip, so the
		 * section keeps its height and the chips arrive in place of the blocks instead of pushing the
		 * fields below them.
		 */
		renderShimmer()
		{
			return this.renderStrip(
				this.getTestId('loader'),
				...SHIMMER_CHIP_WIDTHS.map((width, index) => View(
					{
						key: `shimmer-${index}`,
						style: CHIP_STYLE,
					},
					Line(width, ChipButtonSize.M.getHeight(), 0, 0, ChipButtonSize.M.getRadius().toNumber()),
				)),
			);
		}

		/**
		 * @param {string} testId
		 * @param {...*} children
		 */
		renderStrip(testId, ...children)
		{
			return View(
				{
					testId,
					style: {
						flexDirection: 'row',
						flexWrap: 'wrap',
						alignItems: 'center',
						paddingHorizontal: ROW_PADDING,
						paddingVertical: Indent.S.toNumber(),
						// the gap of the chips also hangs after the last one of a line and under the
						// last line, so it is pulled back: the bottom padding of the strip does not
						// add itself to the one of the area before the divider, and the side padding
						// is not eaten by a chip which would then wrap too early
						marginRight: -CHIP_GAP,
						marginBottom: -CHIP_GAP,
					},
				},
				...children,
			);
		}

		/**
		 * A preset chip carries no counter and no cross, so it is a plain `ChipButton`: the
		 * selected one is filled, the rest are outlined.
		 *
		 * `rounded: false` is what the mockup draws: a chip with a corner, not a pill. The default
		 * of `ChipButton` is the pill (`elementAccentCorner`), the corner of its own size is
		 * `chipsMCorner`.
		 *
		 * Chips are located by position rather than by `preset.id`: the id of a saved filter is
		 * minted from a timestamp, so an autotest cannot know it in advance.
		 *
		 * @param {SavedFilter} preset
		 * @param {number} index
		 */
		renderPresetChip(preset, index)
		{
			const selected = this.isPresetSelected(preset);

			return ChipButton({
				testId: this.getTestId(`preset-${index}`),
				text: preset.name,
				mode: selected ? ChipButtonMode.SOLID : ChipButtonMode.OUTLINE,
				design: selected ? ChipButtonDesign.PRIMARY : ChipButtonDesign.GREY,
				size: ChipButtonSize.M,
				rounded: false,
				style: CHIP_STYLE,
				// the whole preset is the dependency, not its id: the chip applies the conditions it
				// was built with, and an edited preset must not be applied from a stale handler
				onClick: useCallback(() => this.selectPreset(preset), [preset]),
			});
		}

		renderCreateChip()
		{
			return ChipButton({
				testId: this.getTestId('create'),
				text: Loc.getMessage('M_FIELD_FILTER_SAVED_CREATE'),
				icon: Icon.PLUS,
				mode: ChipButtonMode.OUTLINE,
				design: ChipButtonDesign.GREY,
				size: ChipButtonSize.M,
				rounded: false,
				style: CHIP_STYLE,
				onClick: this.openBuilder,
			});
		}
	}

	module.exports = { SavedFiltersSection };
});
