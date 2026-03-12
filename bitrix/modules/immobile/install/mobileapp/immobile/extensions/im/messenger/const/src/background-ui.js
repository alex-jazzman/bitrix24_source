/**
 * @module im/messenger/const/background-ui
 */
jn.define('im/messenger/const/background-ui', (require, exports, module) => {

	const BackgroundUI = {
		manager: {
			openComponentInAnotherContext: 'BackgroundUIManager::openComponentInAnotherContext',
			onCloseActiveComponent: 'BackgroundUIManager::onCloseActiveComponent',
		},
		events: {
			tryToOpenComponentFromAnotherContext: 'BackgroundUIManagerEvents::tryToOpenComponentFromAnotherContext',
		},
	};

	module.exports = { BackgroundUI };
});
