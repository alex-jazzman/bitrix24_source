/**
 * @module crm/conversion/wizard/selector-events
 */
jn.define('crm/conversion/wizard/selector-events', (require, exports, module) => {
	const createSelectorEvents = (onComplete) => {
		let selectedEntities = [];
		let completed = false;

		const complete = () => {
			if (completed)
			{
				return;
			}

			completed = true;
			onComplete(selectedEntities);
		};

		return {
			onClose: (entities) => {
				selectedEntities = entities;
			},
			onViewRemoved: complete,
			// The native close callback can arrive even when onViewRemoved is lost.
			onWidgetClosed: complete,
		};
	};

	module.exports = { createSelectorEvents };
});
