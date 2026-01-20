/**
 * @module onboarding/action
 */
jn.define('onboarding/action', (require, exports, module) => {
	const { AhaMoment } = require('ui-system/popups/aha-moment');

	class ActionBase
	{
		static showHint(options = {})
		{
			const {
				title,
				description,
				testId,
				targetRef,
				onHide,
				onComplete = () => {},
				...extraProps
			} = options;

			if ((!title && !description) || !targetRef)
			{
				return;
			}

			const handleHide = () => {
				if (typeof onHide === 'function')
				{
					onHide();
				}
				onComplete();
			};

			AhaMoment.show({
				targetRef,
				title,
				description,
				onHide: handleHide,
				testId: testId ?? 'onboarding-aha-moment',
				closeButton: false,
				disableHideByOutsideClick: false,
				...extraProps,
			});
		}
	}

	module.exports = {
		ActionBase,
	};
});
