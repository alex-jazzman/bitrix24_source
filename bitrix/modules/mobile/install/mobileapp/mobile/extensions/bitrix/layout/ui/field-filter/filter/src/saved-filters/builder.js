/**
 * @module layout/ui/field-filter/filter/src/saved-filters/builder
 */
jn.define('layout/ui/field-filter/filter/src/saved-filters/builder', (require, exports, module) => {
	const { Type } = require('type');
	const { Loc } = require('loc');
	const { openFilterSheet } = require('layout/ui/field-filter/filter/src/layout/sheet');
	const { Color } = require('tokens');
	const { showErrorToast } = require('toast');
	const { parseSavedFilter } = require('layout/ui/field-filter/filter/src/saved-filters/parser');
	const { runPresetMutation } = require('layout/ui/field-filter/filter/src/saved-filters/mutation');
	const { PureComponent } = require('layout/pure-component');
	const { createTestIdGenerator } = require('utils/test');
	const { Input } = require('ui-system/form/inputs/input');
	const { AreaList } = require('ui-system/layout/area-list');
	const { Box } = require('ui-system/layout/box');
	const { FilterFooter } = require('layout/ui/field-filter/filter/src/layout/footer');
	const { FieldFilterForm } = require('layout/ui/field-filter/filter/src/form');
	const { serializeValues, buildRows, deserializeValues } = require('layout/ui/field-filter/values');
	const { FilterSection, ROW_PADDING } = require('layout/ui/field-filter/filter/src/layout/section');
	const { getClearProps } = require('layout/ui/field-filter/filter/src/layout/clearable-input');

	/**
	 * Same shape as the web filter builds for a brand new preset. Call it once per form: every
	 * call returns a different id, so minting it per request would turn a retry after a failed
	 * save into a second preset instead of an overwrite of the first one.
	 *
	 * @return {string}
	 */
	const createPresetId = () => `filter_${Date.now()}`;

	/**
	 * Saved filter builder. Without a preset in props it composes a brand new filter: the whole set
	 * of fields is offered as pickers of its own, so the preset does not have to repeat the state of
	 * the form behind it. With a preset it edits that one - the same form, filled from the conditions
	 * the preset holds, so a saved filter can be changed and not only renamed.
	 *
	 * @extends {PureComponent<SavedFilterBuilderProps, SavedFilterBuilderState>}
	 */
	class SavedFilterBuilder extends PureComponent
	{
		/**
		 * @param {SavedFilterBuilderProps} props
		 */
		constructor(props)
		{
			super(props);

			this.getTestId = createTestIdGenerator({ context: this, prefix: 'field-filter-saved-builder' });
			// the id the form writes to: for an edit it is the id of the preset, for a new filter
			// it is minted here once and stays the same across save attempts
			this.presetId = props.preset?.id ?? createPresetId();
			const stored = deserializeValues(props.filter.getDescriptors(), props.preset?.fields);
			// the search string of a preset has no control on this form, so it is kept aside and
			// written back on save: an edit must not drop a condition it never showed
			this.search = stored.search;
			this.state = {
				name: props.preset?.name ?? '',
				values: stored.values,
				nameError: false,
				saving: false,
			};

			// the rows, the name input and the save button are pure, so they keep the same handler
			// across renders instead of one built anew on every keystroke
			this.changeValue = this.changeValue.bind(this);
			// a field the consumer serves opens through the filter, the way it opens in the drawer;
			// what it reports lands in the values of this form through the row that opened it
			this.openField = (params) => this.props.filter.openField(params);
			this.changeName = this.changeName.bind(this);
			this.clearName = this.clearName.bind(this);
			this.save = this.save.bind(this);
		}

		componentDidMount()
		{
			this.setBackButton();
		}

		/**
		 * The builder opens over the drawer, so its own navigation bar goes back to it instead of
		 * closing the pair.
		 */
		setBackButton()
		{
			const { widget, close } = this.props;

			widget?.setLeftButtons?.([
				{
					id: 'field-filter-saved-builder-back',
					testId: this.getTestId('back'),
					type: 'back',
					callback: () => close?.(),
				},
			]);
		}

		isEditMode()
		{
			return Boolean(this.props.preset);
		}

		/**
		 * What the preset is stored with: the conditions of this form, plus the fields it puts on the
		 * form of the drawer. An edit is no different from a creation here - the form holds the whole
		 * preset either way, so the conditions follow what is on the screen.
		 *
		 * @return {SavedFilterPayload}
		 */
		getPayload()
		{
			const descriptors = this.props.filter.getDescriptors();
			const { values } = this.state;

			return {
				fields: serializeValues(descriptors, values, this.search),
				rows: buildRows(descriptors, values, this.search),
			};
		}

		/**
		 * @param {*} value whatever the input reports; an empty name is a string, not a null
		 */
		changeName(value)
		{
			const name = Type.isString(value) ? value : '';

			this.setState({
				name,
				nameError: this.state.nameError && !Type.isStringFilled(name.trim()),
			});
		}

		/**
		 * The name is required, so the cross gives an empty field rather than an error: the error is
		 * raised by the save, the way it is raised for a name never typed in.
		 */
		clearName()
		{
			this.changeName('');
		}

		/**
		 * @param {string} fieldId
		 * @param {FieldValue} value
		 */
		changeValue(fieldId, value)
		{
			this.setState({ values: { ...this.state.values, [fieldId]: value } });
		}

		/**
		 * The preset as the server is about to store it: a brand new one carries no flags, an edit
		 * keeps those of the preset it changes.
		 *
		 * @param {string} name
		 * @return {SavedFilter}
		 */
		createPreset(name)
		{
			const { preset } = this.props;
			const { fields, rows } = this.getPayload();

			return {
				id: this.presetId,
				name,
				fields,
				rows,
				pinned: Boolean(preset?.pinned),
				forAll: Boolean(preset?.forAll),
			};
		}

		async save()
		{
			const name = this.state.name.trim();

			if (!Type.isStringFilled(name))
			{
				// the name heads the form, but a form scrolled down to its fields keeps it off screen:
				// an error drawn there alone reads as a button that does nothing
				// the form stands in a widget of its own, and a toast with no widget behind it would
				// be shown on the screen the widget covers
				showErrorToast(
					{ message: Loc.getMessage('M_FIELD_FILTER_SAVED_NAME_REQUIRED') },
					this.props.widget,
				);
				this.setState({ nameError: true });

				return;
			}

			// the form closes on the tap, so the button is latched instead of being re-enabled:
			// a second tap would save the same preset twice
			this.setState({ saving: true });

			const { filter, service, onChanged } = this.props;
			const preset = this.createPreset(name);
			const result = await runPresetMutation({
				filter,
				mutate: () => this.applyLocally(preset),
				request: () => service.save({
					presetId: preset.id,
					name: preset.name,
					fields: preset.fields,
					rows: preset.rows,
				}),
				// the form is gone by then, so a preset taken back out of the store is repainted by
				// the screen that stayed behind it
				onChange: onChanged,
			});

			if (result.success)
			{
				this.reconcile(result);
			}
		}

		/**
		 * The saved preset, as the form composed it: it goes into the store and the form closes over
		 * it, so the strip shows the new filter without waiting for the answer.
		 *
		 * @param {SavedFilter} preset
		 */
		applyLocally(preset)
		{
			this.props.filter.savePreset(preset);
			// the sheet is closed by the caller, which then applies the preset to the form
			this.props.onSaved?.(preset);
		}

		/**
		 * The answer carries the preset as the storage now holds it, so the guess of the form is
		 * replaced by it - without a second request for the list.
		 *
		 * @param {SavedFiltersResult} result
		 */
		reconcile(result)
		{
			const preset = parseSavedFilter(result.data?.presetData);

			if (preset)
			{
				this.props.filter.savePreset(preset);
			}
		}

		render()
		{
			return Box(
				{
					testId: this.getTestId(),
					withScroll: true,
					backgroundColor: Color.bgPrimary,
					footer: this.renderFooter(),
				},
				AreaList(
					{
						testId: this.getTestId('areas'),
						withScroll: false,
					},
					...this.renderAreas(),
				),
			);
		}

		/**
		 * The name comes first: it is what the form is opened for, and a required field at the foot of a
		 * form of dozens of rows is a field nobody scrolls down to.
		 *
		 * @return {Array}
		 */
		renderAreas()
		{
			return [
				this.renderNameField(),
				this.renderParameters(),
			];
		}

		/**
		 * The form of the drawer itself: the same groups, in the same order, with the same "show all
		 * fields" row behind them. A preset is composed here rather than taken as a snapshot of the
		 * drawer, so the values are the ones of this form - the fields a new filter opens on are the
		 * fields the dictionary marks as default, the way the web opens a filter that names no preset.
		 *
		 * An edited preset opens on the fields it holds itself, so its conditions are the rows of the
		 * form and can be changed in place.
		 */
		renderParameters()
		{
			const { filter, widget, preset } = this.props;

			return new FieldFilterForm({
				testId: this.getTestId(),
				title: Loc.getMessage('M_FIELD_FILTER_SAVED_PARAMS_SECTION'),
				descriptors: filter.getDescriptors(),
				sections: filter.getSections(),
				sectionIcons: filter.getSectionIcons(),
				fieldIcons: filter.getFieldIcons(),
				entitySelectors: filter.getEntitySelectors(),
				values: this.state.values,
				rows: preset?.rows,
				gridId: filter.gridId,
				// the rows of a preset word their values the same way the drawer does, so a field whose
				// reference book stayed on the server is read here as well
				loadFieldItems: filter.getFieldItemsLoader?.() ?? null,
				parentWidget: widget,
				onChange: this.changeValue,
				onOpenField: this.openField,
			});
		}

		renderNameField()
		{
			return FilterSection(
				{
					testId: this.getTestId('name'),
					title: Loc.getMessage('M_FIELD_FILTER_SAVED_NAME_SECTION'),
					isFirst: true,
					divider: false,
				},
				View(
					{ style: { paddingHorizontal: ROW_PADDING } },
					Input({
						testId: this.getTestId('name-input'),
						value: this.state.name,
						label: Loc.getMessage('M_FIELD_FILTER_SAVED_NAME_LABEL'),
						placeholder: Loc.getMessage('M_FIELD_FILTER_SAVED_NAME_PLACEHOLDER'),
						required: true,
						error: this.state.nameError,
						errorText: Loc.getMessage('M_FIELD_FILTER_SAVED_NAME_REQUIRED'),
						...getClearProps(this.state.name, this.clearName),
						onChange: this.changeName,
					}),
				),
			);
		}

		renderFooter()
		{
			return FilterFooter({
				testId: this.getTestId('footer'),
				buttonTestId: this.getTestId('save'),
				text: this.isEditMode()
					? Loc.getMessage('M_FIELD_FILTER_SAVED_SAVE')
					: Loc.getMessage('M_FIELD_FILTER_SAVED_CREATE'),
				disabled: this.state.saving,
				onClick: this.save,
			});
		}

		/**
		 * @param {SavedFilterBuilderOptions} options
		 * @return {Promise}
		 */
		static open(options)
		{
			const { filter, service, preset = null, parentWidget = null, onSaved, onChanged } = options;
			const title = preset
				? Loc.getMessage('M_FIELD_FILTER_SAVED_EDIT')
				: Loc.getMessage('M_FIELD_FILTER_SAVED_CREATE');

			return openFilterSheet({
				title,
				parentWidget,
				component: ({ widget, close }) => new SavedFilterBuilder({
					filter,
					service,
					preset,
					widget,
					close,
					onChanged,
					onSaved: (savedPreset) => {
						close();
						onSaved?.(savedPreset);
					},
				}),
			});
		}
	}

	module.exports = { SavedFilterBuilder };
});
