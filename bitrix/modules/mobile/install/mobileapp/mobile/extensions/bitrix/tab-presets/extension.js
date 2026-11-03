/**
 * @module tab-presets
 */
jn.define('tab-presets', (require, exports, module) => {
	const { FeatureFlagType, checkFeatureFlag } = require('feature-flag');
	const { LoadingScreenComponent } = require('layout/ui/loading-screen');
	const { requireLazy } = require('require-lazy');
	const {
		TabPresetsComponent: LegacyTabPresetsComponent,
	} = require('tab-presets/src/legacy/tab-presets-component');
	const { ManualBottomMenu } = require('tab-presets/src/preset-manual/manual-bottom-list');
	const {
		getDraggableMenuItems,
		moveDraggableMenuItem,
	} = require('tab-presets/src/preset-menu-state');
	const {
		PresetBottomMenuAnalytics,
		PresetBottomMenuAnalyticsEvent,
		PresetBottomMenuAnalyticsType,
		PresetBottomMenuAnalyticsRole,
		PresetBottomMenuAnalyticsTarget,
	} = require('tab-presets/src/analytics');

	/**
	 * @extends {LayoutComponent<LegacyTabPresetsComponentProps, TabPresetsResolverState>}
	 */
	class TabPresetsComponent extends LayoutComponent
	{
		/**
		 * @param {LegacyTabPresetsComponentProps} props
		 */
		constructor(props)
		{
			super(props);

			this.state = {
				isModeResolved: false,
				Component: null,
			};

			void this.resolveMode();
		}

		/** @return {Promise<void>} */
		async resolveMode()
		{
			let Component = LegacyTabPresetsComponent;

			try
			{
				const isManagedMode = await checkFeatureFlag(FeatureFlagType.MANAGED_TAB_PRESETS);
				if (isManagedMode === true)
				{
					const managedExtension = await requireLazy('tab-presets/managed', false);
					Component = managedExtension?.TabPresetsComponent ?? LegacyTabPresetsComponent;
				}

				this.setState({
					isModeResolved: true,
					Component,
				});
			}
			catch (error)
			{
				console.error(error);
				this.setState({
					isModeResolved: true,
					Component: LegacyTabPresetsComponent,
				});
			}
		}

		/** @return {LayoutComponent} */
		render()
		{
			return View(
				{
					testId: `${this.testId}_root`,
					style: {
						flex: 1,
					},
				},
				this.renderComponent(),
			);
		}

		/** @return {LayoutComponent} */
		renderComponent()
		{
			if (!this.state.isModeResolved)
			{
				return new LoadingScreenComponent({
					showAirStyle: true,
					testId: `${this.testId}_loading_screen`,
				});
			}

			const Component = this.state.Component ?? LegacyTabPresetsComponent;

			return new Component(this.props);
		}

		/** @return {string} */
		get testId()
		{
			return 'tab_presets';
		}
	}

	module.exports = {
		TabPresetsComponent,
		ManualBottomMenu,
		getDraggableMenuItems,
		moveDraggableMenuItem,
		PresetBottomMenuAnalytics,
		PresetBottomMenuAnalyticsEvent,
		PresetBottomMenuAnalyticsType,
		PresetBottomMenuAnalyticsRole,
		PresetBottomMenuAnalyticsTarget,
	};
});
