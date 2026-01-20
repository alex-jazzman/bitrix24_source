/**
 * @module settings-v2/ui/items/src/security-banner
 */

jn.define('settings-v2/ui/items/src/security-banner', (require, exports, module) => {
	const { SecurityBanner, SafetyType } = require('layout/ui/banners/security');
	const { createTestIdGenerator } = require('utils/test');
	const { Type } = require('type');
	const { EventType } = require('settings-v2/const');

	class SecurityBannerItem extends LayoutComponent
	{
		constructor(props)
		{
			super(props);

			this.getTestId = createTestIdGenerator({
				prefix: 'security-banner-item',
				context: this,
			});

			if (!Type.isArrayFilled(props.controllers))
			{
				throw new Error('SecurityBannerItem: controllers must be an array filled');
			}

			this.controllers = props.controllers;
			this.controllersValues = {};

			this.state = {};
		}

		componentDidMount()
		{
			BX.addCustomEvent(EventType.changeSecurityState, this.updateProgress);
			this.loadProgress().catch(console.error);
		}

		componentWillUnmount()
		{
			BX.removeCustomEvent(EventType.changeSecurityState, this.updateProgress);
		}

		loadProgress = async () => {
			await Promise.all(this.controllers.map(async (controller) => {
				this.controllersValues[controller.settingId] = await controller.get();
			}));

			this.updateState();
		};

		updateProgress = ({ settingId, value }) => {
			this.controllersValues[settingId] = value;

			this.updateState();
		};

		updateState()
		{
			const controllersValuesArray = Object.values(this.controllersValues);

			this.setState({
				progressSize: controllersValuesArray.length,
				progressCount: controllersValuesArray.filter(Boolean).length,
			});
		}

		render()
		{
			const { id, progress } = this.props;

			return SecurityBanner({
				testId: this.getTestId(id),
				progress,
				progressSize: this.state.progressSize,
				progressCount: this.state.progressCount,
			});
		}
	}

	module.exports = {
		SecurityBannerItem,
	};
});
