/**
 * @module tasks/dashboard/src/pull
 */
jn.define('tasks/dashboard/src/pull', (require, exports, module) => {
	class Pull
	{
		static get events()
		{
			return {
				USER_COUNTER: 'user_counter',
				TASK_REMOVE: 'task_remove',
			};
		}

		constructor(data)
		{
			this.eventCallbacks = data.eventCallbacks;
			this.onPullCallback = data.onPullCallback;
			this.onQueueStarted = data.onQueueStarted;
			this.onQueueFinished = data.onQueueFinished;
			this.layout = data.layout;

			this.shouldReloadDynamically = data.shouldReloadDynamically ?? true;
			this.isTabsMode = data.isTabsMode;
			this.activeListener = null;

			this.getPullConfig = this.getPullConfig.bind(this);
		}

		setListActive(isActive)
		{
			if (this.activeListener)
			{
				this.activeListener(isActive);
			}
		}

		unsubscribe()
		{
			if (this.unsubscribeCallback)
			{
				this.unsubscribeCallback();
			}

			if (this.layout)
			{
				this.layout.removeAllListeners();
			}
		}

		subscribe()
		{
			this.unsubscribeCallback = BX.PULL.subscribe({
				moduleId: 'tasks',
				callback: this.processPullEvent.bind(this),
			});

			if (this.isTabsMode)
			{
				BX.postComponentEvent('tasks.dashboard:pullSubscribed', [], 'tasks.tabs');
			}

			if (this.layout)
			{
				this.layout.setListener((eventName) => {
					if (eventName === 'onViewShown')
					{
						this.setListActive(true);
					}

					if (eventName === 'onViewHidden')
					{
						this.setListActive(false);
					}
				});
			}
		}

		processPullEvent(data)
		{
			const { command, params } = data;

			if (this.eventCallbacks[command])
			{
				this.eventCallbacks[command](params);
			}
		}

		getPullConfig()
		{
			return {
				moduleId: 'tasks',
				callback: this.onPullCallback,
				shouldReloadDynamically: this.shouldReloadDynamically,
				onQueueStarted: this.onQueueStarted,
				onQueueFinished: this.onQueueFinished,
				setListActiveListener: (listener) => {
					this.activeListener = listener;
				},
			};
		}
	}

	module.exports = { Pull };
});
