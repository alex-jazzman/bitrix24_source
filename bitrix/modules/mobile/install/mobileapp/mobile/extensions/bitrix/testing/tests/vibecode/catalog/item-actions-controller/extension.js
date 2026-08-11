(() => {
	const require = (ext) => jn.require(ext);
	const { describe, it, expect, beforeEach, afterEach } = require('testing');
	const { Haptics } = require('haptics');
	const { inAppUrl } = require('in-app-url');
	const { RunActionExecutor } = require('rest/run-action-executor');
	const { PopupMenu, PopupMenuPosition } = require('ui-system/popups/popup-menu');
	const {
		VibeCodeCatalogItemActionsController,
	} = require('vibecode/catalog/src/item-actions-controller');

	describe('vibecode/catalog VibeCodeCatalogItemActionsController', () => {
		let openPageCalls = [];
		let inAppUrlCalls = [];
		let recordCalls = [];
		let shownMenus = [];
		let closedMenus = [];
		let hapticCalls = [];
		let originalOpenPage = null;
		let originalInAppUrlOpen = null;
		let originalRunActionCall = null;
		let originalPopupMenuSetActions = null;
		let originalPopupMenuShow = null;
		let originalPopupMenuHide = null;
		let originalHapticsImpactLight = null;
		let controller = null;

		const renderer = {
			getHeaderTitle: () => 'Header Title',
			getTestId: (suffix = '') => `vibecode-catalog-${suffix}`,
		};

		function createMenuItem()
		{
			return {
				id: 42,
				kind: 'application',
				title: 'Cool App',
				viewUrl: 'https://external.test/app/42',
				externalId: 'ext-42',
				isPinned: false,
				isHidden: false,
				isMine: false,
			};
		}

		beforeEach(() => {
			openPageCalls = [];
			inAppUrlCalls = [];
			recordCalls = [];
			shownMenus = [];
			closedMenus = [];
			hapticCalls = [];

			originalOpenPage = PageManager.openPage;
			PageManager.openPage = (params) => {
				openPageCalls.push(params);
			};

			originalInAppUrlOpen = inAppUrl.open;
			inAppUrl.open = (url, options) => {
				inAppUrlCalls.push({ url, options });
			};

			originalRunActionCall = RunActionExecutor.prototype.call;
			RunActionExecutor.prototype.call = function call() {
				recordCalls.push({ action: this.action, options: this.options });

				return Promise.resolve({});
			};

			originalPopupMenuSetActions = PopupMenu.prototype.setActions;
			PopupMenu.prototype.setActions = function setActions(actions) {
				this.testActions = actions;

				return originalPopupMenuSetActions.call(this, actions);
			};

			originalPopupMenuShow = PopupMenu.prototype.show;
			PopupMenu.prototype.show = function show(options) {
				shownMenus.push({
					menu: this,
					options,
					items: this.testActions.items,
				});
			};

			originalPopupMenuHide = PopupMenu.prototype.hide;
			PopupMenu.prototype.hide = function hide() {
				closedMenus.push(this);
			};

			originalHapticsImpactLight = Haptics.impactLight;
			Haptics.impactLight = () => {
				hapticCalls.push(true);
			};

			controller = new VibeCodeCatalogItemActionsController(renderer);
		});

		afterEach(() => {
			PageManager.openPage = originalOpenPage;
			inAppUrl.open = originalInAppUrlOpen;
			RunActionExecutor.prototype.call = originalRunActionCall;
			PopupMenu.prototype.setActions = originalPopupMenuSetActions;
			PopupMenu.prototype.show = originalPopupMenuShow;
			PopupMenu.prototype.hide = originalPopupMenuHide;
			Haptics.impactLight = originalHapticsImpactLight;
		});

		it('opens an application with externalId inside the app via the portal entry url', () => {
			const item = {
				id: 42,
				kind: 'application',
				title: 'Cool App',
				viewUrl: 'https://external.test/app/42',
				externalId: 'ext-42',
			};

			controller.openVibeCodeItem(item);

			expect(inAppUrlCalls.length).toBe(0);
			expect(openPageCalls.length).toBe(1);
			expect(openPageCalls[0].url).toBe('/mobile/vibecode/open-app/?catalogItemId=42');
			expect(openPageCalls[0].bx24ModernStyle).toBe(true);
			expect(openPageCalls[0].titleParams.text).toBe('Cool App');

			expect(recordCalls.length).toBe(1);
			expect(recordCalls[0].action).toBe('vibecodeconnector.Catalog.recordOpen');
			expect(recordCalls[0].options.catalogItemId).toBe(42);
		});

		it('falls back to the external open when externalId is missing', () => {
			const item = {
				id: 7,
				kind: 'application',
				title: 'Legacy App',
				viewUrl: 'https://external.test/app/7',
				externalId: null,
			};

			controller.openVibeCodeItem(item);

			expect(openPageCalls.length).toBe(0);
			expect(inAppUrlCalls.length).toBe(1);
			expect(inAppUrlCalls[0].url).toBe('https://external.test/app/7');
			expect(inAppUrlCalls[0].options.title).toBe('Legacy App');
			expect(recordCalls.length).toBe(1);
			expect(recordCalls[0].options.catalogItemId).toBe(7);
		});

		it('does not use the app-open path for a bot with a chat', () => {
			const item = {
				id: 5,
				kind: 'bot',
				title: 'Support Bot',
				chatId: 123,
			};

			controller.openVibeCodeItem(item);

			expect(openPageCalls.length).toBe(0);
			expect(inAppUrlCalls.length).toBe(0);
			expect(recordCalls.length).toBe(1);
			expect(recordCalls[0].options.catalogItemId).toBe(5);
		});

		it('uses the header title when the item has no title', () => {
			const item = {
				id: 3,
				kind: 'application',
				viewUrl: 'https://external.test/app/3',
				externalId: 'ext-3',
			};

			controller.openVibeCodeItem(item);

			expect(openPageCalls.length).toBe(1);
			expect(openPageCalls[0].titleParams.text).toBe('Header Title');
		});

		it('does nothing for an application without a view url', () => {
			const item = {
				id: 9,
				kind: 'application',
				externalId: 'ext-9',
			};

			controller.openVibeCodeItem(item);

			expect(openPageCalls.length).toBe(0);
			expect(inAppUrlCalls.length).toBe(0);
			expect(recordCalls.length).toBe(0);
		});

		it('does nothing when no item is provided', () => {
			controller.openVibeCodeItem(null);

			expect(openPageCalls.length).toBe(0);
			expect(inAppUrlCalls.length).toBe(0);
			expect(recordCalls.length).toBe(0);
		});

		it('opens the popup menu with haptic feedback on a long press', () => {
			const item = createMenuItem();
			const targetRef = { id: 'more-button' };

			controller.handleItemLongClick(item.id, item, { targetRef });

			expect(hapticCalls.length).toBe(1);
			expect(shownMenus.length).toBe(1);
			expect(shownMenus[0].options.position).toBe(PopupMenuPosition.BOTTOM);
			expect(shownMenus[0].options.target).toBe(targetRef);
		});

		it('does not trigger feedback or menu actions without an item', () => {
			controller.handleItemActionClick(null, null);
			controller.handleItemLongClick(null, null);

			expect(hapticCalls.length).toBe(0);
			expect(shownMenus.length).toBe(0);
		});

		it('uses the same popup menu items for the ellipsis and long press', () => {
			const item = createMenuItem();
			const targetRef = { id: 'more-button' };

			controller.handleItemActionClick(item.id, item, { targetRef });
			controller.handleItemLongClick(item.id, item, { targetRef });

			const actionClickIds = shownMenus[0].items.map(({ id }) => id);
			const longClickIds = shownMenus[1].items.map(({ id }) => id);

			expect(longClickIds).toEqual(actionClickIds);
			expect(shownMenus[0].options.target).toBe(targetRef);
			expect(shownMenus[0].options.position).toBe(PopupMenuPosition.BOTTOM);
			expect(shownMenus[1].options.target).toBe(targetRef);
			expect(shownMenus[1].options.position).toBe(PopupMenuPosition.BOTTOM);
			expect(hapticCalls.length).toBe(1);
		});

		it('runs open, pin and hide actions through PopupMenu callbacks', () => {
			const item = createMenuItem();
			const actionCalls = [];
			controller.openVibeCodeItem = (selectedItem) => actionCalls.push(['open', selectedItem]);
			controller.toggleVibeCodeItemPin = (selectedItem) => actionCalls.push(['pin', selectedItem]);
			controller.toggleVibeCodeItemHidden = (selectedItem) => actionCalls.push(['hide', selectedItem]);

			controller.handleItemActionClick(item.id, item);
			const items = shownMenus[0].items;
			items.find(({ id }) => id === 'vibecode-open').onItemSelected();
			items.find(({ id }) => id === 'vibecode-pin').onItemSelected();
			items.find(({ id }) => id === 'vibecode-hide').onItemSelected();

			expect(actionCalls).toEqual([
				['open', item],
				['pin', item],
				['hide', item],
			]);
		});

		it('closes the active popup menu on dispose', () => {
			const item = createMenuItem();
			controller.handleItemActionClick(item.id, item);

			controller.dispose();

			expect(closedMenus.length).toBe(1);
			expect(controller.vibeCodeItemPopupMenu).toBeNull();
		});
	});
})();
