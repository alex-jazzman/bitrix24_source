/**
 * @module manual-testing-tools/src/factory
 */
jn.define('manual-testing-tools/src/factory', (require, exports, module) => {

	const ToolType = {
		AppRatingManager: 'AppRatingManager',
		Onboarding: 'Onboarding',
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
