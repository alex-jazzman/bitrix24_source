(() => {
	const require = (ext) => jn.require(ext);
	const { describe, it, expect, beforeEach } = require('testing');

	describe('selector/widget EntitySelectorWidget', () => {
		const { EntitySelectorWidget } = require('selector/widget');

		// Test double for selector provider — replaces CommonSelectorProvider via provider.class injection.
		class TestSelectorProvider
		{
			constructor(context, options)
			{
				this.context = context;
				this.options = options;
				this.queryString = '';
				this.calls = {
					setSearchFields: 0,
					setEntityWeight: 0,
					setPreselectedItems: 0,
					setCanUseRecent: 0,
					setListener: 0,
					loadRecent: 0,
					doSearch: 0,
				};
				this.listener = null;
			}

			setSearchFields() { this.calls.setSearchFields++; }
			setEntityWeight() { this.calls.setEntityWeight++; }
			setPreselectedItems() { this.calls.setPreselectedItems++; }
			setCanUseRecent() { this.calls.setCanUseRecent++; }
			setListener(listener) { this.calls.setListener++; this.listener = listener; }
			loadRecent() { this.calls.loadRecent++; }
			doSearch(query) { this.calls.doSearch++; this.queryString = query; }
		}

		// Mock native widget — tracks setEmptyState invocations and provides the rest of the
		// surface that the production code touches (no-op stubs).
		function createMockNativeWidget()
		{
			const calls = {
				setEmptyState: [],
				setReturnKey: 0,
				setScopes: 0,
				setPlaceholder: 0,
				setLeftButtons: 0,
				setRightButtons: 0,
				allowMultipleSelection: 0,
				on: 0,
				setListener: 0,
				setItems: 0,
				setSections: 0,
				setSectionsArgs: [],
				setQueryText: 0,
				close: 0,
			};

			return {
				calls,
				setEmptyState(config) { calls.setEmptyState.push(config); },
				setReturnKey() { calls.setReturnKey++; },
				setScopes() { calls.setScopes++; },
				setPlaceholder() { calls.setPlaceholder++; },
				setLeftButtons() { calls.setLeftButtons++; },
				setRightButtons() { calls.setRightButtons++; },
				allowMultipleSelection() { calls.allowMultipleSelection++; },
				on() { calls.on++; },
				setListener() { calls.setListener++; },
				setItems() { calls.setItems++; },
				setSections(sections) { calls.setSections++; calls.setSectionsArgs.push(sections); },
				setQueryText() { calls.setQueryText++; },
				close(cb) { calls.close++; if (typeof cb === 'function') { cb(); } },
			};
		}

		// Mock PageManager-like parent that returns a mock widget from openWidget.
		// `params` records the most recent openWidget call so the test can inspect airWidgetParams.
		function createMockParentWidget(mockWidget)
		{
			const state = { openWidgetCalls: [] };

			return {
				state,
				openWidget(name, params)
				{
					state.openWidgetCalls.push({ name, params });

					return Promise.resolve(mockWidget);
				},
			};
		}

		const baseOptions = () => ({
			entityIds: ['user'],
			provider: { class: TestSelectorProvider },
		});

		// Build widget with default safe options; caller can override anything.
		function createWidget(overrides = {})
		{
			return new EntitySelectorWidget({ ...baseOptions(), ...overrides });
		}

		const sampleEmptyState = { image: 'https://example.com/empty.png', title: 'No data', text: 'Try later' };

		// -- Backward compatibility (FF=off) ---------------------------------------------

		it('shouldDelegateEmptyStateToNative returns false when no empty state and FF off', () => {
			const widget = createWidget();
			widget.isNativeEmptyStateEnabled = false;

			expect(widget.isNativeEmptyStateSupported()).toBe(false);
			expect(widget.shouldDelegateEmptyStateToNative()).toBe(false);
		});

		it('shouldDelegateEmptyStateToNative returns false when empty state is set but FF off', () => {
			const widget = createWidget({ emptyState: sampleEmptyState });
			widget.isNativeEmptyStateEnabled = false;

			expect(widget.shouldDelegateEmptyStateToNative()).toBe(false);
		});

		it('show does not put emptyState into airWidgetParams when FF off', async () => {
			const widget = createWidget({ emptyState: sampleEmptyState });
			widget.isNativeEmptyStateEnabled = false;

			const mockWidget = createMockNativeWidget();
			const parent = createMockParentWidget(mockWidget);

			await widget.show({}, parent);

			expect(parent.state.openWidgetCalls.length).toBe(1);
			const { params } = parent.state.openWidgetCalls[0];
			expect(params.emptyState).toBeUndefined();
		});

		it('prepareProviderItems adds fake empty item when FF off and result is empty', () => {
			const widget = createWidget();
			widget.isNativeEmptyStateEnabled = false;

			const { processedItems, hasContentItems } = widget.prepareProviderItems([], false, true);

			expect(hasContentItems).toBe(false);
			expect(processedItems.length).toBe(1);
			expect(processedItems[0].type).toBe('button');
			expect(processedItems[0].unselectable).toBe(true);
		});

		// -- FF=on, only emptyState ------------------------------------------------------

		it('shouldDelegateEmptyStateToNative returns true when emptyState set and FF on', () => {
			const widget = createWidget({ emptyState: sampleEmptyState });
			widget.isNativeEmptyStateEnabled = true;

			expect(widget.shouldDelegateEmptyStateToNative()).toBe(true);
		});

		it('show passes emptyState (shallow copy) into airWidgetParams when FF on', async () => {
			const widget = createWidget({ emptyState: sampleEmptyState });
			widget.isNativeEmptyStateEnabled = true;

			const mockWidget = createMockNativeWidget();
			const parent = createMockParentWidget(mockWidget);

			await widget.show({}, parent);

			const { params } = parent.state.openWidgetCalls[0];
			expect(params.emptyState).toEqual(sampleEmptyState);
			// Shallow-copied in constructor so it must not be the same reference as the input.
			expect(params.emptyState).not.toBe(sampleEmptyState);
		});

		it('prepareProviderItems does NOT add fake empty item when delegating to native', () => {
			const widget = createWidget({ emptyState: sampleEmptyState });
			widget.isNativeEmptyStateEnabled = true;

			const { processedItems, hasContentItems } = widget.prepareProviderItems([], false, true);

			expect(hasContentItems).toBe(false);
			expect(processedItems.length).toBe(0);
		});

		// -- shouldDelegateEmptyStateToNative coverage -----------------------

		it('shouldDelegateEmptyStateToNative returns false when no emptyState set and FF on', () => {
			const widget = createWidget();
			widget.isNativeEmptyStateEnabled = true;

			expect(widget.shouldDelegateEmptyStateToNative()).toBe(false);
		});

		// -- Public setters ------------------------------------------------------------

		it('setEmptyState updates state and calls native', () => {
			const widget = createWidget({ emptyState: sampleEmptyState });
			widget.isNativeEmptyStateEnabled = true;
			widget.widget = createMockNativeWidget();

			const newConfig = { image: 'i', title: 't', text: 'x' };
			widget.setEmptyState(newConfig);

			expect(widget.emptyState).toEqual(newConfig);
			expect(widget.emptyState).not.toBe(newConfig);
			expect(widget.widget.calls.setEmptyState.length).toBe(1);
			expect(widget.widget.calls.setEmptyState[0]).toEqual(newConfig);
		});

		it('setEmptyState with null clears emptyState', () => {
			const widget = createWidget({ emptyState: sampleEmptyState });
			widget.isNativeEmptyStateEnabled = true;
			widget.widget = createMockNativeWidget();

			widget.setEmptyState(null);

			expect(widget.emptyState).toBeNull();
		});

		// -- setEmptyState with FF off does not invoke native --------------------------

		it('setEmptyState updates state but does not call native when FF off', () => {
			const widget = createWidget({ emptyState: sampleEmptyState });
			widget.isNativeEmptyStateEnabled = false;
			widget.widget = createMockNativeWidget();

			const newConfig = { image: 'x', title: 'y', text: 'z' };
			widget.setEmptyState(newConfig);

			expect(widget.emptyState).toEqual(newConfig);
			expect(widget.emptyState).not.toBe(newConfig);
			expect(widget.widget.calls.setEmptyState.length).toBe(0);
		});

		// -- setItems common section gating (native empty state delegation) -------------

		it('setItems does not push common section when delegating empty state to native and items are empty', () => {
			const widget = createWidget({ emptyState: sampleEmptyState });
			widget.isNativeEmptyStateEnabled = true;
			widget.widget = createMockNativeWidget();

			expect(widget.shouldDelegateEmptyStateToNative()).toBe(true);

			// Seed a common section first, then empty the list: with native delegation the
			// common section must be dropped from the sections passed to the widget.
			widget.setItems([{ id: 'seed', sectionCode: 'common', title: 'Seed' }]);
			widget.setItems([]);

			const sectionsArgs = widget.widget.calls.setSectionsArgs;
			const lastSections = sectionsArgs[sectionsArgs.length - 1];
			expect(lastSections.some((section) => section.id === 'common')).toBe(false);
		});

		it('setItems pushes common section when not delegating to native (backward compat) and items are empty', () => {
			const widget = createWidget();
			widget.isNativeEmptyStateEnabled = false;
			widget.widget = createMockNativeWidget();

			expect(widget.shouldDelegateEmptyStateToNative()).toBe(false);

			widget.setItems([]);

			const sectionsArgs = widget.widget.calls.setSectionsArgs;
			expect(sectionsArgs.length).toBe(1);
			const lastSections = sectionsArgs[sectionsArgs.length - 1];
			expect(lastSections.some((section) => section.id === 'common')).toBe(true);
		});

		it('setItems pushes common section even when delegating to native if common items exist', () => {
			const widget = createWidget({ emptyState: sampleEmptyState });
			widget.isNativeEmptyStateEnabled = true;
			widget.widget = createMockNativeWidget();

			expect(widget.shouldDelegateEmptyStateToNative()).toBe(true);

			widget.setItems([{ id: 'x', sectionCode: 'common', title: 'X' }]);

			const sectionsArgs = widget.widget.calls.setSectionsArgs;
			expect(sectionsArgs.length).toBe(1);
			const lastSections = sectionsArgs[sectionsArgs.length - 1];
			expect(lastSections.some((section) => section.id === 'common')).toBe(true);
		});

		// -- show(): initial recent emptyState applied before loadRecent ----------------

		it('show() calls widget.setEmptyState with emptyState when native FF on and emptyState configured', async () => {
			const widget = createWidget({ emptyState: sampleEmptyState });
			widget.isNativeEmptyStateEnabled = true;

			const mockWidget = createMockNativeWidget();
			const parent = createMockParentWidget(mockWidget);

			// Capture the number of setEmptyState calls observed at the moment loadRecent fires
			// to assert ordering (setEmptyState must be applied BEFORE provider.loadRecent).
			const originalLoadRecent = widget.provider.loadRecent.bind(widget.provider);
			let setEmptyStateCallsAtLoadRecent = -1;
			widget.provider.loadRecent = function loadRecentSpy() {
				setEmptyStateCallsAtLoadRecent = mockWidget.calls.setEmptyState.length;
				originalLoadRecent();
			};

			await widget.show({}, parent);

			expect(mockWidget.calls.setEmptyState.length).toBeGreaterThan(0);
			expect(mockWidget.calls.setEmptyState[0]).toEqual(sampleEmptyState);
			expect(setEmptyStateCallsAtLoadRecent).toBeGreaterThan(0);
		});

		it('show() does not call widget.setEmptyState when native FF off', async () => {
			const widget = createWidget({ emptyState: sampleEmptyState });
			widget.isNativeEmptyStateEnabled = false;

			const mockWidget = createMockNativeWidget();
			const parent = createMockParentWidget(mockWidget);

			await widget.show({}, parent);

			expect(mockWidget.calls.setEmptyState.length).toBe(0);
		});

		// -- setItems forced first dispatch (initialItemsApplied) ----------------------

		it('setItems forces widget.setItems on first call even when items equal cached empty array', () => {
			const widget = createWidget({ emptyState: sampleEmptyState });
			widget.isNativeEmptyStateEnabled = true;
			widget.widget = createMockNativeWidget();

			expect(widget.initialItemsApplied).toBe(false);

			widget.setItems([]);

			expect(widget.initialItemsApplied).toBe(true);
			expect(widget.widget.calls.setItems).toBe(1);
		});

		it('setItems skips widget.setItems on second identical empty call (isEqual short-circuit retained)', () => {
			const widget = createWidget({ emptyState: sampleEmptyState });
			widget.isNativeEmptyStateEnabled = true;
			widget.widget = createMockNativeWidget();

			widget.setItems([]);
			widget.setItems([]);

			expect(widget.widget.calls.setItems).toBe(1);
		});

		it('onViewHidden / onViewRemoved / onWidgetClosed reset initialItemsApplied', () => {
			const widget = createWidget({ emptyState: sampleEmptyState });
			widget.isNativeEmptyStateEnabled = true;

			widget.widget = createMockNativeWidget();
			widget.setItems([]);
			expect(widget.initialItemsApplied).toBe(true);
			widget.onViewHidden();
			expect(widget.initialItemsApplied).toBe(false);

			widget.widget = createMockNativeWidget();
			widget.setItems([]);
			expect(widget.initialItemsApplied).toBe(true);
			widget.onViewRemoved();
			expect(widget.initialItemsApplied).toBe(false);

			widget.widget = createMockNativeWidget();
			widget.setItems([]);
			expect(widget.initialItemsApplied).toBe(true);
			widget.onWidgetClosed();
			expect(widget.initialItemsApplied).toBe(false);
		});

		it('setItems forced first dispatch works even when FF off (initialItemsApplied is FF-independent)', () => {
			const widget = createWidget();
			widget.isNativeEmptyStateEnabled = false;
			widget.widget = createMockNativeWidget();

			widget.setItems([]);

			expect(widget.initialItemsApplied).toBe(true);
			expect(widget.widget.calls.setItems).toBe(1);
		});

		// -- onListFillListener --------------------------------------------------------

		it('onListFillListener does not throw when text is undefined', () => {
			const widget = createWidget({ emptyState: sampleEmptyState });
			widget.isNativeEmptyStateEnabled = true;
			widget.widget = createMockNativeWidget();

			expect(() => widget.onListFillListener({})).not.toThrow();
			expect(widget.queryText).toBe('');
		});
	});
})();
