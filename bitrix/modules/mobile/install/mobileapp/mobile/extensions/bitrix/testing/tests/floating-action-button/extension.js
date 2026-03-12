(() => {
	const require = (ext) => jn.require(ext);

	const { describe, test, expect, beforeEach } = require('testing');
	const { Icon } = require('assets/icons');
	const { FloatingActionButton, FloatingActionButtonType } = require('ui-system/form/buttons/floating-action-button');

	describe('FloatingActionButton', () => {
		let mockLayout;

		const createMockLayout = () => ({
			removeAllListenersCalls: [],
			onCalls: [],
			setFloatingButtonCalls: [],

			removeAllListeners(event) {
				this.removeAllListenersCalls.push(event);
			},

			on(event, handler) {
				this.onCalls.push({ event, handler });
			},

			setFloatingButton(options) {
				this.setFloatingButtonCalls.push(options);
			},
		});

		beforeEach(() => {
			mockLayout = createMockLayout();
		});

		test('should create instance with required props', () => {
			const fab = new FloatingActionButton({
				layout: mockLayout,
				icon: Icon.LOCK,
				testId: 'fab-test',
			});

			expect(fab).toBeDefined();
		});

		test('should throw error when layout is not provided', () => {
			expect(() => new FloatingActionButton()).toThrow();
		});

		test('should set default options on show()', () => {
			const fab = new FloatingActionButton({ layout: mockLayout });

			fab.show();

			expect(mockLayout.setFloatingButtonCalls.length).toEqual(1);

			const args = mockLayout.setFloatingButtonCalls[0];

			expect(args.testId).toEqual('floating-action-button');
			expect(args.type).toEqual(FloatingActionButtonType.COMMON.getValue());
			expect(args.accentByDefault).toBeFalse();
			expect(args.showLoader).toBeFalse();
		});

		test('should set custom type via constructor', () => {
			const fab = new FloatingActionButton({
				layout: mockLayout,
				type: FloatingActionButtonType.COPILOT,
			});

			fab.show();

			const args = mockLayout.setFloatingButtonCalls[0];
			expect(args.type).toEqual(FloatingActionButtonType.COPILOT.getValue());
		});

		test('setAccentByDefault should update value', () => {
			const fab = new FloatingActionButton({ layout: mockLayout });

			fab.setAccentByDefault(true).show();

			const args = mockLayout.setFloatingButtonCalls[0];
			expect(args.accentByDefault).toBeTrue();
		});

		test('setShowLoader should update value', () => {
			const fab = new FloatingActionButton({ layout: mockLayout });

			fab.setShowLoader(true).show();
			const args = mockLayout.setFloatingButtonCalls[0];

			expect(args.showLoader).toBeTrue();
		});

		test('setIcon should update icon if valid', () => {
			const fab = new FloatingActionButton({ layout: mockLayout });

			fab.setIcon(Icon.ALERT).show();
			const args = mockLayout.setFloatingButtonCalls[0];

			expect(args.icon).toEqual(Icon.ALERT.getIconName());
		});

		test('setIcon should not update if same icon', () => {
			const fab = new FloatingActionButton({
				layout: mockLayout,
				icon: Icon.BEER,
			});

			const updateCallsBefore = mockLayout.setFloatingButtonCalls.length;

			fab.setIcon(Icon.BEER);

			const updateCallsAfter = mockLayout.setFloatingButtonCalls.length;
			expect(updateCallsAfter).toEqual(updateCallsBefore);
		});

		test('setType should update type', () => {
			const fab = new FloatingActionButton({ layout: mockLayout });

			fab.setType(FloatingActionButtonType.COPILOT).show();

			const args = mockLayout.setFloatingButtonCalls[0];
			expect(args.type).toEqual(FloatingActionButtonType.COPILOT.getValue());
		});

		test('setType should not update if same type', () => {
			const fab = new FloatingActionButton({
				layout: mockLayout,
				type: FloatingActionButtonType.COMMON,
			});

			const before = mockLayout.setFloatingButtonCalls.length;

			fab.setType(FloatingActionButtonType.COMMON);

			const after = mockLayout.setFloatingButtonCalls.length;
			expect(after).toEqual(before);
		});

		test('should subscribe event listeners', () => {
			const onClick = () => {};

			const onLongClick = () => {};

			new FloatingActionButton({
				layout: mockLayout,
				onClick,
				onLongClick,
			});

			expect(mockLayout.removeAllListenersCalls).toEqual([
				'floatingButtonTap',
				'floatingButtonLongTap',
			]);

			expect(mockLayout.onCalls.length).toEqual(2);
			expect(mockLayout.onCalls[0].event).toEqual('floatingButtonTap');
			expect(mockLayout.onCalls[0].handler).toBe(onClick);

			expect(mockLayout.onCalls[1].event).toEqual('floatingButtonLongTap');
			expect(mockLayout.onCalls[1].handler).toBe(onLongClick);
		});

		test('show should call setFloatingButton', () => {
			const fab = new FloatingActionButton({ layout: mockLayout });

			fab.show();

			expect(mockLayout.setFloatingButtonCalls.length).toEqual(1);
		});

		test('hide should clear FAB', () => {
			const fab = new FloatingActionButton({ layout: mockLayout });

			fab.hide();

			expect(mockLayout.setFloatingButtonCalls.length).toEqual(1);
			expect(mockLayout.setFloatingButtonCalls[0]).toEqual({});
		});

		test('method chaining should work', () => {
			const fab = new FloatingActionButton({ layout: mockLayout });

			const result = fab
				.setAccentByDefault(true)
				.setShowLoader(true)
				.setIcon(Icon.PLUS)
				.setType(FloatingActionButtonType.COPILOT);

			expect(result).toBe(fab);
		});
	});
})();
