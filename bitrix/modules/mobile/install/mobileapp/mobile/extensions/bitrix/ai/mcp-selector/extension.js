/**
 * @module ai/mcp-selector
 */
jn.define('ai/mcp-selector', (require, exports, module) => {
	const { MCPSelectorItem } = require('ai/mcp-selector/ui/item');
	const { createTestIdGenerator } = require('utils/test');
	const { MCPSelectorDataProvider } = require('ai/mcp-selector/data-provider');
	const { StatusBlock } = require('ui-system/blocks/status-block');
	const { makeLibraryImagePath } = require('asset-manager');
	const { qrauth } = require('qrauth/utils');
	const { Color } = require('tokens');
	const { Box } = require('ui-system/layout/box');
	const { Button, ButtonSize, ButtonDesign } = require('ui-system/form/buttons/button');
	const { SpinnerLoader } = require('layout/ui/loaders/spinner');

	const { showToast } = require('toast');
	const { Icon } = require('assets/icons');
	const { PlanRestriction } = require('layout/ui/plan-restriction');
	const { Loc } = require('loc');
	const { Type } = require('type');
	const { mergeImmutable } = require('utils/object');

	class MCPSelector extends LayoutComponent
	{
		/**
		 * @param {MCPSelectorProps} props
		 */
		constructor(props)
		{
			super(props);

			this.layoutWidget = null;
			this.config = null;
			this.getTestId = createTestIdGenerator({
				prefix: 'mcp-selector',
				context: this,
			});

			this.items = this.props.items ?? null;

			this.state = {
				isLoading: !Type.isArrayFilled(this.items),
				selectedAuthId: this.props.selectedAuthId ?? null,
			};

			this.provider = new MCPSelectorDataProvider({
				cacheHandler: this.onLoad,
				responseHandler: this.onLoad,
				onItemSelect: this.onSelect,
			});
		}

		get isLoading()
		{
			return this.state.isLoading;
		}

		get isEmpty()
		{
			return !this.isLoading && !Type.isArrayFilled(this.items);
		}

		get isReady()
		{
			return !this.isLoading && Type.isArrayFilled(this.items);
		}

		componentDidMount()
		{
			if (Type.isArrayFilled(this.items))
			{
				return;
			}

			this.provider.load();
		}

		onLoad = async (data) => {
			const { items, disabledByTariff } = data;

			if (disabledByTariff)
			{
				this.showPlanRestriction();
			}

			this.items = items;

			this.setState({ isLoading: false, disabledByTariff });
		};

		render()
		{
			return Box(
				{
					withScroll: this.isReady,
					resizableByKeyboard: true,
					backgroundColor: Color.bgSecondary,
					safeArea: { bottom: true },
					scrollProps: {},
				},

				this.isLoading && this.renderLoader(),
				this.isEmpty && this.renderEmptyState(),
				this.isReady && this.renderContent(),
			);
		}

		renderLoader()
		{
			return View(
				{
					style: {
						flex: 1,
						justifyContent: 'center',
						alignItems: 'center',
					},
				},
				SpinnerLoader({ size: 30 }),
			);
		}

		renderContent()
		{
			return View(
				{
					style: {
						width: '100%',
					},
				},
				this.renderItems(),
			);
		}

		showPlanRestriction()
		{
			PlanRestriction.open({
				title: Loc.getMessage('MCP_SELECTOR_PLAN_RESTRICTION_TITLE'),
				text: Loc.getMessage('MCP_SELECTOR_PLAN_RESTRICTION_DESCRIPTION'),
			}, this.layoutWidget);
		}

		renderItems()
		{
			return View(
				{
					flex: 1,
				},
				...this.items.map((item, index) => MCPSelectorItem(
					{
						...item,
						selectedAuthId: this.state.selectedAuthId,
						disableDivider: index === this.items.length - 1,
					},
				)),
			);
		}

		renderEmptyState()
		{
			return View(
				{
					style: {
						justifyContent: 'center',
						alignItems: 'center',
						flex: 1,
					},
				},
				StatusBlock({
					testId: this.getTestId('empty-state'),
					title: Loc.getMessage('MCP_SELECTOR_EMPTY_STATE_TITLE'),
					description: Loc.getMessage('MCP_SELECTOR_EMPTY_STATE_DESCRIPTION'),
					buttons: [
						Button({
							testId: this.getTestId('empty-state-button'),
							text: Loc.getMessage('MCP_SELECTOR_EMPTY_STATE_BUTTON'),
							onClick: () => {
								qrauth.open({
									showHint: true,
									analyticsSection: 'mcp-selector-empty-state',
								});
							},
							size: ButtonSize.L,
							design: ButtonDesign.OUTLINE_ACCENT_2,
							stretched: true,
						}),
					],
					image: Image({
						resizeMode: 'contain',
						uri: makeLibraryImagePath('empty-integrations.png', 'empty-states'),
						style: {
							width: 128,
							height: 128,
						},
					}),
				}),
			);
		}

		onSelect = ({ authId, serverId }) => {
			const selectedServer = this.items.find((item) => item.id === serverId);

			if (selectedServer.isDisabled)
			{
				if (this.state.disabledByTariff)
				{
					this.showPlanRestriction();

					return;
				}

				showToast({
					message: Loc.getMessage('MCP_SELECTOR_TOAST_ADMIN_RESTRICTED'),
					icon: Icon.LOCK,
				});

				return;
			}

			if (!selectedServer.isActive || !Type.isArrayFilled(selectedServer.authorizations))
			{
				qrauth.open({
					title: Loc.getMessage('MCP_SELECTOR_QR_AUTH_TITLE'),
					showHint: true,
					analyticsSection: 'mcp-selector-not-active-server',
				});

				return;
			}

			let selectedAuth = null;

			if (selectedServer && !authId)
			{
				if (selectedServer.authorizations.length === 1)
				{
					selectedAuth = selectedServer.authorizations[0];
					this.finalizeSelect({ selectedAuth, selectedServer });

					return;
				}

				this.layoutWidget.openWidget('layout', {
					titleParams: {
						type: 'dialog',
						text: selectedServer.name,
					},
				}).then((layoutWidget) => {
					layoutWidget.showComponent(
						new this.constructor({
							items: selectedServer.authorizations,
							selectedAuthId: this.state.selectedAuthId,
							onSelect: this.onSelect,
						}, this.layoutWidget),
					);
				}).catch(console.error);

				return;
			}

			selectedAuth = selectedServer.authorizations.find((auth) => auth.id === authId);
			this.finalizeSelect({ selectedAuth, selectedServer });
		};

		finalizeSelect = ({ selectedAuth, selectedServer }) => {
			const { onSelect } = this.props;

			if (this.state.selectedAuthId === selectedAuth.id)
			{
				this.state.selectedAuthId = null;
				selectedAuth = null;
				selectedServer= null;
			}

			this.state.selectedAuthId = selectedAuth?.id;
			onSelect({ selectedAuth, selectedServer });
			this.close();
		};

		async open(
			config = {},
			parentWidget = PageManager,
		) {
			const mergedConfig = mergeImmutable(
				{
					titleParams: {
						text: Loc.getMessage('MCP_SELECTOR_TITLE'),
						type: 'dialog',
					},
					modal: true,
					backdrop: {
						onlyMediumPosition: false,
						mediumPositionPercent: 60,
						navigationBarColor: Color.bgSecondary.toHex(),
						horizontalSwipeAllowed: false,
						swipeAllowed: true,
						swipeContentAllowed: false,
					},
				},
				config,
			);

			parentWidget.openWidget('layout', mergedConfig).then((layoutWidget) => {
				this.layoutWidget = layoutWidget;
				layoutWidget.showComponent(this);
			}).catch(console.error);
		}

		close()
		{
			this.layoutWidget.close();
		}
	}

	module.exports = {
		MCPSelector,
	};
});
