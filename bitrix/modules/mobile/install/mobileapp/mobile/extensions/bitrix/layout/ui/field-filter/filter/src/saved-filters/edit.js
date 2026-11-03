/**
 * @module layout/ui/field-filter/filter/src/saved-filters/edit
 */
jn.define('layout/ui/field-filter/filter/src/saved-filters/edit', (require, exports, module) => {
	const { Loc } = require('loc');
	const { Type } = require('type');
	const { openFilterSheet } = require('layout/ui/field-filter/filter/src/layout/sheet');
	const { SavedFilterBuilder } = require('layout/ui/field-filter/filter/src/saved-filters/builder');
	const { runPresetMutation } = require('layout/ui/field-filter/filter/src/saved-filters/mutation');
	const { Color, Component, Indent } = require('tokens');
	const { showErrorToast } = require('toast');
	const { confirmDestructiveAction } = require('alert');
	const { PureComponent } = require('layout/pure-component');
	const { createTestIdGenerator } = require('utils/test');
	const { useCallback } = require('utils/function');
	const { Text3, Text5 } = require('ui-system/typography/text');
	const { Icon, IconView } = require('ui-system/blocks/icon');
	const { PopupMenu } = require('ui-system/popups/popup-menu');
	const { IconAction, getHitOverhang, ICON_SIZE } = require('layout/ui/field-filter/filter/src/layout/icon-action');
	const { Box } = require('ui-system/layout/box');
	const { ButtonDesign } = require('ui-system/form/buttons/button');
	const { FilterFooter } = require('layout/ui/field-filter/filter/src/layout/footer');
	const { Line } = require('utils/skeleton');
	const { FilterSection, ROW_PADDING } = require('layout/ui/field-filter/filter/src/layout/section');

	/**
	 * What a row of the list keeps above and below its content. Also how far the tappable icons of the
	 * row may grow past themselves - a row that grew further would take the taps aimed at its
	 * neighbour, see IconAction.
	 * @type {number}
	 */
	const ROW_PADDING_VERTICAL = Indent.M.toNumber();

	/**
	 * Widths of the names the wait draws in place of the rows: presets are named by hand, so blocks
	 * of one width would read as a table and not as a list of names on its way.
	 * @type {number[]}
	 */
	const SHIMMER_NAME_WIDTHS = [164, 132, 196, 148];

	/**
	 * Height of a placeholder name, the line `Text3` occupies in a row.
	 * @type {number}
	 */
	const SHIMMER_NAME_HEIGHT = 14;

	/**
	 * Edit mode of the saved filters: reorder, rename, delete, pin and "visible to everyone".
	 *
	 * The order is dragged, as it is in the web, and it is kept where the web keeps it - the `sort` of
	 * a preset. The rows are a native list for that reason alone: the drag of a row belongs to the
	 * list itself (`dragInteractionEnabled`), and a list of views has nothing to drag with.
	 *
	 * @extends {PureComponent<SavedFiltersEditProps, SavedFiltersEditState>}
	 */
	class SavedFiltersEdit extends PureComponent
	{
		/**
		 * @param {SavedFiltersEditProps} props
		 */
		constructor(props)
		{
			super(props);

			this.getTestId = createTestIdGenerator({ context: this, prefix: 'field-filter-saved-edit' });
			// the store already holds the list the strip behind this screen is drawn from, so the
			// screen opens on it and the request only refreshes it
			this.state = {
				...this.readStore(),
				loading: !props.filter.arePresetsLoaded(),
			};
			this.actionRefs = {};
			/**
			 * How many actions of the user this screen has applied. An answer of the server read before
			 * one of them is an answer about a list that no longer exists.
			 * @type {number}
			 */
			this.applied = 0;

			// both are pure props of pure children, so they keep the same handler across renders
			this.confirmRestore = this.confirmRestore.bind(this);
			this.syncFromStore = this.syncFromStore.bind(this);
			this.renderRow = this.renderRow.bind(this);
			this.dropRow = this.dropRow.bind(this);
		}

		/**
		 * The store is the single source of the list; the state of this screen is a projection of
		 * it, so a change put into the store repaints the rows on the same frame.
		 *
		 * @return {{presets: SavedFilter[], defaultPresetId: string|null}}
		 */
		readStore()
		{
			const { filter } = this.props;

			return {
				presets: filter.getPresets(),
				defaultPresetId: filter.getDefaultPresetId(),
			};
		}

		syncFromStore()
		{
			this.setState({ ...this.readStore(), loading: false });
			// the strip of the drawer draws the same list and is rebuilt from the store by its owner
			this.props.onChanged?.();
		}

		componentDidMount()
		{
			this.setDoneButton();
			void this.reload();
		}

		setDoneButton()
		{
			const { widget, close } = this.props;

			widget?.setRightButtons?.([
				{
					id: 'field-filter-saved-edit-done',
					name: Loc.getMessage('M_FIELD_FILTER_SAVED_EDIT_DONE'),
					color: Color.accentMainLinks.toHex(),
					callback: () => close?.(),
				},
			]);
		}

		async reload()
		{
			const applied = this.applied;
			const result = await this.props.service.load();

			if (!result.success)
			{
				showErrorToast({ message: result.message });
				this.setState({ loading: false });

				return;
			}

			// the screen opens on the list the store already holds and refreshes it in the background,
			// so the user acts while this answer is on its way. The answer was read before those
			// actions: written over the store now, it brings back the filter they deleted and undoes
			// the name and the order they changed - while the server has already taken all three
			if (applied !== this.applied)
			{
				this.setState({ loading: false });

				return;
			}

			this.props.filter.setSavedFilters(result.data);
			this.syncFromStore();
		}

		/**
		 * Every action of this screen is applied to the store first and sent afterwards, so the row
		 * answers the tap at once; a refused request puts the list back as it was.
		 *
		 * @param {{mutate: function(), request: function(): Promise<SavedFiltersResult>}} params
		 * @return {Promise<SavedFiltersResult>}
		 */
		runMutation({ mutate, request })
		{
			this.applied++;

			return runPresetMutation({
				filter: this.props.filter,
				mutate,
				request,
				onChange: this.syncFromStore,
			});
		}

		/**
		 * One warning for every preset: the storage is shared with the web, so a deletion reaches
		 * that list too, whoever the preset belongs to. There is no honest way to tell a preset the
		 * module ships from one the user saved - see SavedFilterStorage::mapPreset() - and the
		 * warning does not need that difference anyway.
		 *
		 * @param {SavedFilter} preset
		 */
		confirmDelete(preset)
		{
			const { filter, service } = this.props;

			confirmDestructiveAction({
				title: Loc.getMessage('M_FIELD_FILTER_SAVED_DELETE_TITLE', { '#NAME#': preset.name }),
				description: Loc.getMessage('M_FIELD_FILTER_SAVED_DELETE_DESC'),
				destructionText: Loc.getMessage('M_FIELD_FILTER_SAVED_DELETE_CONFIRM'),
				cancelText: Loc.getMessage('M_FIELD_FILTER_SAVED_CANCEL'),
				onDestruct: () => {
					void this.runMutation({
						mutate: () => filter.removePreset(preset.id),
						request: () => service.remove(preset.id),
					});
				},
			});
		}

		/**
		 * The one action nothing can be drawn from in advance: the presets the module ships with are
		 * server data, so the restored list is read instead of composed.
		 */
		confirmRestore()
		{
			confirmDestructiveAction({
				title: Loc.getMessage('M_FIELD_FILTER_SAVED_RESTORE_TITLE'),
				description: Loc.getMessage('M_FIELD_FILTER_SAVED_RESTORE_DESC'),
				destructionText: Loc.getMessage('M_FIELD_FILTER_SAVED_RESTORE_CONFIRM'),
				cancelText: Loc.getMessage('M_FIELD_FILTER_SAVED_CANCEL'),
				onDestruct: async () => {
					const result = await this.props.service.restore();

					if (!result.success)
					{
						showErrorToast({ message: result.message });

						return;
					}

					await this.reload();
				},
			});
		}

		/**
		 * @param {SavedFilter} preset
		 * @return {Promise<SavedFiltersResult>}
		 */
		togglePin(preset)
		{
			const { filter, service } = this.props;

			if (preset.pinned)
			{
				return this.runMutation({
					mutate: () => filter.unpinPreset(),
					request: () => service.unpin(),
				});
			}

			return this.runMutation({
				mutate: () => filter.pinPreset(preset.id),
				request: () => service.pin(preset.id),
			});
		}

		/**
		 * Shows the preset to everyone on the portal, or takes it back - one preset at a time. The
		 * web marks presets for all in its settings mode and publishes the marked ones together;
		 * here the mark of a single preset is what changes.
		 *
		 * @param {SavedFilter} preset
		 * @return {Promise<SavedFiltersResult>}
		 */
		toggleForAll(preset)
		{
			const { filter, service } = this.props;
			const forAll = !preset.forAll;

			return this.runMutation({
				mutate: () => filter.setPresetForAll(preset.id, forAll),
				request: () => (forAll ? service.setForAll(preset.id) : service.unsetForAll(preset.id)),
			});
		}

		/**
		 * @param {SavedFilter} preset
		 */
		openEditor(preset)
		{
			const { filter, service, widget } = this.props;

			void SavedFilterBuilder.open({
				filter,
				service,
				preset,
				parentWidget: widget,
				// the new name is already in the store - the builder put it there before sending it
				onSaved: (saved) => this.onPresetSaved(saved),
				onChanged: this.syncFromStore,
			});
		}

		/**
		 * A preset edited here is not applied: this screen manages the saved filters, and the list goes
		 * on showing what it showed.
		 *
		 * The one exception is the preset the list is under right now. Its conditions have just changed,
		 * so a chip left selected over the old values of the form promises conditions neither the form
		 * nor the list holds - and `getCurrentPresetRows()` already answers with the new rows. The strip
		 * does the same for a preset saved from the builder, see FilterSection::applySavedPreset().
		 *
		 * @param {SavedFilter} saved
		 */
		onPresetSaved(saved)
		{
			const { filter } = this.props;

			if (Type.isStringFilled(saved?.id) && saved.id === filter.getCurrentFilterId())
			{
				filter.applyPreset(saved);
			}

			this.syncFromStore();
		}

		/**
		 * Actions of one saved filter. "For everyone" is offered only where the right to it is: the
		 * server refuses `setForAll`/`unsetForAll` without the operation of the portal behind it
		 * (SavedFilterStorage::changeForAll), and every action of this screen is applied before its
		 * answer arrives - so an item offered without the right ends in a rollback and a toast,
		 * whatever the user picks.
		 *
		 * @param {SavedFilter} preset
		 * @return {object[]}
		 */
		getActionItems(preset)
		{
			const items = [
				{
					id: 'edit',
					title: Loc.getMessage('M_FIELD_FILTER_SAVED_EDIT'),
					icon: Icon.EDIT,
					onItemSelected: () => this.openEditor(preset),
				},
				{
					id: 'pin',
					title: preset.pinned
						? Loc.getMessage('M_FIELD_FILTER_SAVED_UNPIN')
						: Loc.getMessage('M_FIELD_FILTER_SAVED_PIN'),
					icon: preset.pinned ? Icon.UNPIN : Icon.PIN,
					onItemSelected: () => {
						void this.togglePin(preset);
					},
				},
			];

			if (this.props.filter.canEditForAll())
			{
				items.push({
					id: 'forAll',
					title: preset.forAll
						? Loc.getMessage('M_FIELD_FILTER_SAVED_FOR_ALL_OFF')
						: Loc.getMessage('M_FIELD_FILTER_SAVED_FOR_ALL'),
					icon: Icon.GROUP,
					onItemSelected: () => {
						void this.toggleForAll(preset);
					},
				});
			}

			return items;
		}

		/**
		 * @param {SavedFilter} preset
		 */
		openActions(preset)
		{
			new PopupMenu({ items: this.getActionItems(preset) })
				.show({ target: this.actionRefs[preset.id] });
		}

		render()
		{
			const { loading } = this.state;

			return Box(
				{
					testId: this.getTestId(),
					// the rows scroll themselves once they are there: two scrolls on one axis take each
					// other's gestures, and the drag of a row needs the one of the list
					withScroll: loading,
					backgroundColor: Color.bgPrimary,
					footer: this.renderFooter(),
				},
				loading
					? FilterSection(
						{
							testId: this.getTestId('list'),
							isFirst: true,
							divider: false,
						},
						this.renderShimmer(),
					)
					: this.renderListArea(),
			);
		}

		/**
		 * The list fills the screen, so it cannot stand in an `Area`: the area is as tall as its content
		 * and a list inside it would have no height of its own. The paddings of the first area are kept
		 * by hand instead - the rows bring their own horizontal ones, as they always did.
		 */
		renderListArea()
		{
			return View(
				{
					testId: this.getTestId('list'),
					style: {
						flex: 1,
						paddingTop: Component.areaPaddingTFirst.toNumber(),
						paddingBottom: Component.areaPaddingB.toNumber(),
					},
				},
				this.renderList(),
			);
		}

		/**
		 * The wait for the list: rows of the height they will have, each with a block where the name
		 * of a preset goes. The screen is a list and nothing else, so a spinner in the middle of it
		 * says less than the list itself does while it is on its way.
		 */
		renderShimmer()
		{
			return View(
				{
					testId: this.getTestId('loader'),
					style: { flexDirection: 'column' },
				},
				...SHIMMER_NAME_WIDTHS.map((width, index) => View(
					{
						key: `shimmer-${index}`,
						style: {
							paddingHorizontal: ROW_PADDING,
							paddingVertical: ROW_PADDING_VERTICAL,
							borderBottomWidth: index === SHIMMER_NAME_WIDTHS.length - 1 ? 0 : 1,
							borderBottomColor: Color.bgSeparatorSecondary.toHex(),
						},
					},
					// the icons of a row are what makes it as tall as it is, so the block stands in a
					// box of their height: the names arrive in place of the blocks and the list
					// below the wait does not move
					View(
						{ style: { height: ICON_SIZE, justifyContent: 'center' } },
						Line(width, SHIMMER_NAME_HEIGHT),
					),
				)),
			);
		}

		/**
		 * The order the rows were dragged into, by the two positions the list reports.
		 *
		 * @param {number} fromIndex
		 * @param {number} toIndex
		 * @return {?Promise<SavedFiltersResult>} null when the row was dropped where it was taken from
		 */
		moveRow(fromIndex, toIndex)
		{
			if (fromIndex === toIndex)
			{
				return null;
			}

			const { filter, service } = this.props;
			const ids = this.state.presets.map(({ id }) => id);
			const [moved] = ids.splice(fromIndex, 1);

			if (moved === undefined)
			{
				return null;
			}

			ids.splice(toIndex, 0, moved);

			return this.runMutation({
				mutate: () => filter.reorderPresets(ids),
				request: () => service.reorder(ids),
			});
		}

		/**
		 * @param {{from: {index: number}, to: {index: number}}} itemMove
		 */
		dropRow(itemMove)
		{
			void this.moveRow(itemMove?.from?.index, itemMove?.to?.index);
		}

		/**
		 * Rows of the list, as the native list takes them: plain data plus what the row is drawn by.
		 *
		 * @return {Array<{key: string, preset: SavedFilter, index: number, isLast: boolean}>}
		 */
		getRowItems()
		{
			const { presets } = this.state;

			return presets.map((preset, index) => ({
				key: preset.id,
				preset,
				index,
				isLast: index === presets.length - 1,
			}));
		}

		renderList()
		{
			const { presets } = this.state;

			if (presets.length === 0)
			{
				return View(
					{ style: { paddingHorizontal: ROW_PADDING } },
					Text3({
						testId: this.getTestId('empty'),
						text: Loc.getMessage('M_FIELD_FILTER_SAVED_EMPTY'),
						color: Color.base3,
					}),
				);
			}

			// the list scrolls itself: a scroll around it would take the gesture the drag of a row needs,
			// and the height of a row is not known in advance - the hint under a name is there or not
			return ListView({
				testId: this.getTestId('rows'),
				style: { flex: 1 },
				data: [{ items: this.getRowItems() }],
				renderItem: this.renderRow,
				dragInteractionEnabled: true,
				onItemDrop: this.dropRow,
			});
		}

		/**
		 * Rows are located by position rather than by `preset.id`: the id of a saved filter is
		 * minted from a timestamp, so an autotest cannot know it in advance.
		 *
		 * @param {{preset: SavedFilter, index: number, isLast: boolean}} item
		 */
		renderRow({ preset, index, isLast })
		{
			const getTestId = createTestIdGenerator({ prefix: this.getTestId(`row-${index}`) });

			return View(
				{
					testId: getTestId(),
					style: {
						flexDirection: 'row',
						alignItems: 'center',
						paddingHorizontal: ROW_PADDING,
						paddingVertical: ROW_PADDING_VERTICAL,
						borderBottomWidth: isLast ? 0 : 1,
						borderBottomColor: Color.bgSeparatorSecondary.toHex(),
					},
				},
				// the row is dragged by a long press anywhere on it; the handle says so, the way the
				// stage list of CRM says it
				IconView({
					testId: getTestId('handle'),
					icon: Icon.DRAG,
					size: ICON_SIZE,
					color: Color.base4,
					style: { marginRight: Indent.M.toNumber() },
				}),
				View(
					{ style: { flex: 1, flexDirection: 'column' } },
					Text3({
						testId: getTestId('name'),
						text: preset.name,
						color: Color.base1,
						onClick: useCallback(() => this.openEditor(preset), [preset]),
					}),
					this.renderRowHint(preset, getTestId),
				),
				IconAction({
					testId: getTestId('actions'),
					icon: Icon.MORE,
					// as tall as the row: the padding below is where the area of the next row begins
					verticalOverhang: ROW_PADDING_VERTICAL,
					forwardRef: useCallback((ref) => {
						this.actionRefs[preset.id] = ref;
					}, [preset.id]),
					onClick: useCallback(() => this.openActions(preset), [preset]),
				}),
				IconAction({
					testId: getTestId('delete'),
					icon: Icon.CROSS,
					verticalOverhang: ROW_PADDING_VERTICAL,
					// the boxes of the two icons stand side by side and bring the gap between them
					// themselves; the row takes the area back on its own edge, so the cross keeps the
					// padding of the row it always had
					marginRight: -getHitOverhang(),
					onClick: useCallback(() => this.confirmDelete(preset), [preset]),
				}),
			);
		}

		/**
		 * @param {SavedFilter} preset
		 * @param {function(string=): string} getTestId locator of the row this hint belongs to
		 */
		renderRowHint(preset, getTestId)
		{
			const hints = [];

			// the default pointer of the list, unrelated to preset.default ("shipped by the module")
			if (this.state.defaultPresetId === preset.id)
			{
				hints.push(Loc.getMessage('M_FIELD_FILTER_SAVED_IS_DEFAULT'));
			}

			if (preset.pinned)
			{
				hints.push(Loc.getMessage('M_FIELD_FILTER_SAVED_PINNED'));
			}

			if (preset.forAll)
			{
				hints.push(Loc.getMessage('M_FIELD_FILTER_SAVED_FOR_ALL_DONE'));
			}

			if (hints.length === 0)
			{
				return null;
			}

			return Text5({
				testId: getTestId('hint'),
				text: hints.join(', '),
				color: Color.base3,
			});
		}

		renderFooter()
		{
			return FilterFooter({
				testId: this.getTestId('footer'),
				buttonTestId: this.getTestId('restore'),
				text: Loc.getMessage('M_FIELD_FILTER_SAVED_RESTORE'),
				design: ButtonDesign.OUTLINE,
				onClick: this.confirmRestore,
			});
		}

		/**
		 * @param {SavedFiltersEditOptions} options
		 * @return {Promise}
		 */
		static open(options)
		{
			const { filter, service, parentWidget = null, onChanged } = options;

			return openFilterSheet({
				title: Loc.getMessage('M_FIELD_FILTER_SAVED_TITLE'),
				parentWidget,
				component: ({ widget, close }) => new SavedFiltersEdit({
					filter,
					service,
					widget,
					onChanged,
					close,
				}),
			});
		}
	}

	module.exports = { SavedFiltersEdit };
});
