(() => {
	const require = (extension) => jn.require(extension);
	const { CoworkMeetupPromo } = require('intranet/cowork-meetup-promo/story');

	const BACKGROUND_UI_MANAGER_CLOSE_EVENT = 'BackgroundUIManager::onCloseActiveComponent';
	const WIDGET_CLOSE_EVENTS = new Set(['onViewHidden', 'onViewRemoved']);

	let isBackgroundQueueReleased = false;

	// the manager keeps the promo as the active background component until it is told otherwise,
	// and a second event would drop the component it has just taken from the queue
	const releaseBackgroundQueue = () => {
		if (isBackgroundQueueReleased)
		{
			return;
		}

		isBackgroundQueueReleased = true;
		BX.postComponentEvent(BACKGROUND_UI_MANAGER_CLOSE_EVENT, []);
	};

	BX.onViewLoaded(() => {
		// a native dismiss of the sheet bypasses the slider callbacks
		layout.setListener((eventName) => {
			if (WIDGET_CLOSE_EVENTS.has(eventName))
			{
				releaseBackgroundQueue();
			}
		});

		CoworkMeetupPromo.show({
			onClose: () => {
				releaseBackgroundQueue();
				layout.close();
			},
		}).catch((error) => {
			console.error('CoworkMeetupPromo: failed to show', error);
			releaseBackgroundQueue();
			layout.close();
		});
	});
})();
