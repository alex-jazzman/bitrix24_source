/**
 * @module vibecode/catalog/src/header-controller
 */
jn.define('vibecode/catalog/src/header-controller', (require, exports, module) => {
	const { inAppUrl } = require('in-app-url');
	const { Loc } = require('loc');
	const { Color } = require('tokens');
	const { Icon } = require('assets/icons');
	const { PopupMenu, PopupMenuPosition } = require('ui-system/popups/popup-menu');
	const {
		CATALOG_STATE,
		VIBECODE_CREATE_URL,
		VIBECODE_MENU_SECTION_CODE,
	} = require('vibecode/catalog/src/const');

	const CATALOG_STATE_ORDER = [
		CATALOG_STATE.ACTIVE,
		CATALOG_STATE.HIDDEN,
		CATALOG_STATE.ALL,
	];

	class VibeCodeCatalogHeaderController
	{
		constructor(renderer)
		{
			this.renderer = renderer;
			this.statePopupMenu = null;
		}

		getHeaderConfig()
		{
			return {
				title: this.renderer.getHeaderTitle(),
				rightButtons: this.getHeaderRightButtons(),
			};
		}

		syncHeaderState()
		{
			this.updateWidgetHeader();
			this.notifyHeaderUpdate();
		}

		notifyHeaderUpdate()
		{
			if (typeof this.renderer.props.onHeaderUpdate === 'function')
			{
				this.renderer.props.onHeaderUpdate(this.getHeaderConfig());
			}
		}

		updateWidgetHeader()
		{
			if (this.renderer.isHeaderHidden())
			{
				return;
			}

			const widget = this.renderer.props.layout;
			if (!widget)
			{
				return;
			}

			widget.setTitle?.({
				text: this.renderer.getHeaderTitle(),
			}, true);
			this.setBackdropLeftButtons(widget);
			widget.setRightButtons?.(this.getHeaderRightButtons());
		}

		setBackdropLeftButtons(widget)
		{
			widget.setLeftButtons?.([
				{
					type: 'back',
					callback: () => {
						if (this.renderer.isNested() && typeof widget.back === 'function')
						{
							widget.back();

							return;
						}

						widget.close();
					},
				},
			]);
		}

		getHeaderRightButtons()
		{
			if (!this.renderer.getListData().isAvailable)
			{
				return [];
			}

			const buttons = [];

			if (!this.isFloatingCreateButtonSupported() && this.shouldShowCreateButton())
			{
				buttons.push(this.getCreateHeaderButtonConfig());
			}

			buttons.push({
				id: 'vibecode_catalog_search',
				type: 'search',
				callback: this.renderer.searchController.handleSearchClick,
			});
			buttons.push({
				id: 'vibecode_catalog_state_filter',
				type: 'more',
				accent: this.renderer.getCatalogState() !== CATALOG_STATE.ACTIVE,
				callback: this.handleStateFilterClick,
			});

			return buttons;
		}

		getCreateHeaderButtonConfig()
		{
			return {
				id: 'vibecode_catalog_create',
				type: 'plus',
				callback: this.handleCreateButtonClick,
			};
		}

		getCreateFloatingButtonConfig()
		{
			return {
				type: 'plus',
				callback: this.handleCreateButtonClick,
				icon: Icon.PLUS.getIconName(),
				animation: 'hide_on_scroll',
				color: Color.accentBrandBlue.toHex(),
				showLoader: false,
				accentByDefault: false,
			};
		}

		shouldShowCreateButton()
		{
			return (
				this.renderer.getListData().isAvailable === true
				&& this.renderer.state.isLoading !== true
				&& this.renderer.state.loadError !== true
				&& this.renderer.state.listItemsCount > 0
			);
		}

		isFloatingCreateButtonSupported()
		{
			return typeof this.renderer.getParentWidget()?.setFloatingButton === 'function';
		}

		syncCreateButtonState()
		{
			if (!this.isFloatingCreateButtonSupported())
			{
				return;
			}

			if (this.shouldShowCreateButton())
			{
				this.renderer.getParentWidget().setFloatingButton(this.getCreateFloatingButtonConfig());

				return;
			}

			this.hideCreateFloatingButton();
		}

		hideCreateFloatingButton()
		{
			if (this.isFloatingCreateButtonSupported())
			{
				this.renderer.getParentWidget().setFloatingButton({});
			}
		}

		dispose()
		{
			this.hideCreateFloatingButton();
			this.hideStatePopupMenu();
		}

		hideStatePopupMenu()
		{
			this.statePopupMenu?.hide?.();
			this.statePopupMenu = null;
		}

		getCatalogStateTitle(state)
		{
			const messageId = {
				[CATALOG_STATE.ACTIVE]: 'MOBILE_VIBECODE_CATALOG_STATE_ACTIVE',
				[CATALOG_STATE.HIDDEN]: 'MOBILE_VIBECODE_CATALOG_STATE_HIDDEN',
				[CATALOG_STATE.ALL]: 'MOBILE_VIBECODE_CATALOG_STATE_ALL',
			}[state];

			return Loc.getMessage(messageId);
		}

		handleStateFilterClick = () => {
			this.hideStatePopupMenu();
			this.statePopupMenu = new PopupMenu({
				items: CATALOG_STATE_ORDER.map((state) => ({
					id: `vibecode-catalog-state-${state}`,
					testId: this.renderer.getTestId(`state-menu-${state}`),
					title: this.getCatalogStateTitle(state),
					checked: state === this.renderer.getCatalogState(),
					sectionCode: VIBECODE_MENU_SECTION_CODE,
					onItemSelected: () => this.handleCatalogStateSelected(state),
				})),
				sections: [
					{
						id: VIBECODE_MENU_SECTION_CODE,
					},
				],
			});

			this.statePopupMenu.show({
				position: PopupMenuPosition.TOP_RIGHT,
			});
		};

		handleCatalogStateSelected(state)
		{
			this.hideStatePopupMenu();
			this.renderer.handleCatalogStateChange(state);
		}

		handleCreateButtonClick = () => {
			inAppUrl.open(VIBECODE_CREATE_URL, {
				title: this.renderer.getHeaderTitle(),
			});
		};
	}

	module.exports = {
		VibeCodeCatalogHeaderController,
	};
});
