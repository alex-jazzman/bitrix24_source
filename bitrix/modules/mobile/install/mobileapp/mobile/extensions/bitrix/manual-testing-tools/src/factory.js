/**
 * @module manual-testing-tools/src/factory
 */
jn.define('manual-testing-tools/src/factory', (require, exports, module) => {

	const ToolType = {
		AppRatingManager: 'AppRatingManager',
		Onboarding: 'Onboarding',
		MapStates: 'MapStates',
	};

	class ToolFactory
	{
		static create(toolName)
		{
			switch (toolName)
			{
				case ToolType.AppRatingManager:
					const { AppRatingManagerManualTestingTool } = require('app-rating-manager/manual-testing-tool');

					return AppRatingManagerManualTestingTool();
				case ToolType.Onboarding:
					const { OnboardingTestingTool } = require('onboarding/testing-tool');

					return OnboardingTestingTool();
				case ToolType.MapStates:
					const { MapStatesTestingTool } = require('stafftrack/check-in-v3/map-testing-tool');

					return MapStatesTestingTool();
				default:
					return null;
			}
		}
	}

	module.exports = {
		ToolFactory,
		ToolType,
	};
});
