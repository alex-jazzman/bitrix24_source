/**
 * @module tasks/layout/fields/result/list
 */
jn.define('tasks/layout/fields/result/list', (require, exports, module) => {
	const { Loc } = require('loc');
	const { BottomSheet } = require('bottom-sheet');
	const { UIScrollView } = require('layout/ui/scroll-view');
	const { TaskResultListItem } = require('tasks/layout/fields/result/list-item');
	const { Color } = require('tokens');

	const store = require('statemanager/redux/store');
	const { selectByTaskId } = require('tasks/statemanager/redux/slices/tasks-results');

	class TaskResultList extends LayoutComponent
	{
		/**
		 * @public
		 * @param {object} data
		 * @param {number} data.taskId
		 * @param {function} data.onResultClick
		 * @param {PageManager} [data.parentWidget=PageManager]
		 */
		static open(data = {})
		{
			const resultList = new TaskResultList({
				taskId: Number(data.taskId),
				onResultClick: data.onResultClick,
			});

			void new BottomSheet({
				titleParams: {
					text: Loc.getMessage('TASKS_FIELDS_RESULT_LIST_WIDGET_TITLE'),
					type: 'dialog',
				},
				component: resultList,
			})
				.setParentWidget(data.parentWidget || PageManager)
				.setBackgroundColor(Color.bgSecondary.toHex())
				.setNavigationBarColor(Color.bgSecondary.toHex())
				.alwaysOnTop()
				.open()
				.then((widget) => {
					resultList.parentWidget = widget;
				})
				.catch(console.error)
			;
		}

		constructor(props)
		{
			super(props);

			this.parentWidget = null;
		}

		componentDidMount()
		{
			this.unsubscribeResultsCountObserver = this.observeResultsCountChange();
		}

		componentWillUnmount()
		{
			this.unsubscribeResultsCountObserver?.();
		}

		observeResultsCountChange()
		{
			return store.subscribe(() => {
				const resultsCount = selectByTaskId(store.getState(), this.props.taskId).length;
				if (resultsCount === 0)
				{
					this.parentWidget.close();
				}
			});
		}

		render()
		{
			const taskResults = selectByTaskId(store.getState(), this.props.taskId);

			return UIScrollView({
				style: {
					height: '100%',
				},
				children: taskResults.map((item, index) => {
					return TaskResultListItem({
						id: item.id,
						showBottomBorder: (index !== taskResults.length - 1),
						onResultClick: this.props.onResultClick,
					});
				}),
				testId: 'TASK_RESULT_LIST',
			});
		}
	}

	module.exports = { TaskResultList };
});
