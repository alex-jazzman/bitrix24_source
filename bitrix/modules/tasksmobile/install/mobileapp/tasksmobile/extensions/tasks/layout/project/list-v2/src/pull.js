/**
 * @module tasks/layout/project/list-v2/src/pull
 */
jn.define('tasks/layout/project/list-v2/src/pull', (require, exports, module) => {
	const { Pull: StatefulListPull } = require('layout/ui/stateful-list/pull');
	const { RunActionExecutor } = require('rest/run-action-executor');

	const PROJECTS_PULL_TAG = 'TASKS_PROJECTS';
	const PROJECT_COUNTER_COMMAND = 'project_counter';
	const USER_COUNTER_COMMAND = 'user_counter';
	const EXTEND_WATCH_INTERVAL = 29 * 60 * 1000;
	const COUNTERS_UPDATE_DELAY = 1000;

	class ProjectListPull
	{
		/**
		 * @param {object} props
		 * @param {Function} props.onProjectCounter
		 * @param {Function} props.onUserCounter
		 * @param {number} props.userId
		 */
		constructor(props)
		{
			this.onProjectCounter = props.onProjectCounter;
			this.onUserCounter = props.onUserCounter;
			this.userId = Number(props.userId);
			this.unsubscribeCallback = null;
			this.extendWatchTimer = null;
			this.updateCountersTimer = null;

			this.getPullConfig = this.getPullConfig.bind(this);
		}

		subscribe()
		{
			this.extendWatch();
			void this.startWatchList();

			this.unsubscribeCallback = BX.PULL.subscribe({
				moduleId: 'tasks',
				callback: this.processPullEvent,
			});
		}

		unsubscribe()
		{
			if (this.unsubscribeCallback)
			{
				this.unsubscribeCallback();
				this.unsubscribeCallback = null;
			}

			clearTimeout(this.extendWatchTimer);
			clearTimeout(this.updateCountersTimer);
		}

		extendWatch()
		{
			BX.PULL.extendWatch(PROJECTS_PULL_TAG, true);
			this.extendWatchTimer = setTimeout(() => this.extendWatch(), EXTEND_WATCH_INTERVAL);
		}

		startWatchList()
		{
			return (new RunActionExecutor('tasksmobile.Project.startWatchList'))
				.setHandler((response) => {
					if (response.errors && response.errors.length > 0)
					{
						console.error(response.errors);
					}
				})
				.call(false)
			;
		}

		processPullEvent = ({ command, params } = {}) => {
			if (command === PROJECT_COUNTER_COMMAND)
			{
				this.scheduleCountersUpdate();

				return;
			}

			if (command === USER_COUNTER_COMMAND && this.isCurrentUserCounter(params))
			{
				this.onUserCounter(params);
			}
		};

		isCurrentUserCounter(params)
		{
			return Number(params?.userId) === this.userId;
		}

		scheduleCountersUpdate()
		{
			if (this.updateCountersTimer)
			{
				return;
			}

			this.updateCountersTimer = setTimeout(() => {
				this.updateCountersTimer = null;
				this.onProjectCounter();
			}, COUNTERS_UPDATE_DELAY);
		}

		getPullConfig()
		{
			return {
				moduleId: 'tasks',
				callback: this.onPullCallback,
			};
		}

		onPullCallback = ({ command, params } = {}) => {
			return new Promise((resolve) => {
				if (command !== PROJECT_COUNTER_COMMAND)
				{
					return;
				}

				const projectId = Number(params?.GROUP_ID ?? 0);
				if (projectId <= 0)
				{
					return;
				}

				this.scheduleCountersUpdate();
				resolve({
					params: {
						eventName: StatefulListPull.command.UPDATED,
						items: [{ id: projectId }],
					},
				});
			});
		};
	}

	module.exports = { ProjectListPull };
});
