/**
 * @module tasks/layout/fields/result-v2/view
 */
jn.define('tasks/layout/fields/result-v2/view', (require, exports, module) => {
	const { PureComponent } = require('layout/pure-component');
	const { BottomSheet } = require('bottom-sheet');
	const { Loc } = require('loc');
	const { ViewContent } = require('tasks/layout/fields/result-v2/view/src/view-content');
	const { Menu } = require('tasks/layout/fields/result-v2/menu');
	const { Color } = require('tokens');
	const { confirmDestructiveAction } = require('alert');
	const { PropTypes } = require('utils/validation');

	const store = require('statemanager/redux/store');
	const { selectResultsByTaskId } = require('tasks/statemanager/redux/slices/tasks-results-v2');

	class TaskResultView extends PureComponent
	{
		/**
		 * @public
		 * @param {object} params
		 * @param {number} params.taskId
		 * @param {number} params.resultId
		 * @param {boolean} [params.isFocused=false]
		 * @param {boolean} [params.isWithAnotherResultsEmptyState=true]
		 * @param {PageManager} [params.parentWidget=PageManager]
		 * @param {function} params.onSave
		 * @param {function} params.onRemove
		 */
		static open(params = {})
		{
			const parentWidget = params.parentWidget || PageManager;

			void new BottomSheet({
				titleParams: {
					text: Loc.getMessage('TASKS_FIELDS_RESULT_V2_VIEW_ADD_WIDGET_TITLE'),
					type: 'dialog',
				},
				component: (widget) => {
					return new TaskResultView({
						taskId: params.taskId,
						resultId: params.resultId,
						isFocused: params.isFocused === true,
						isWithAnotherResultsEmptyState: params.isWithAnotherResultsEmptyState !== false,
						layoutWidget: widget,
						layoutParentWidget: parentWidget,
						onSave: params.onSave,
						onRemove: params.onRemove,
					});
				},
			})
				.setParentWidget(parentWidget)
				.setBackgroundColor(Color.bgSecondary.toHex())
				.setNavigationBarColor(Color.bgSecondary.toHex())
				.alwaysOnTop()
				.open()
			;
		}

		constructor(props)
		{
			super(props);

			this.menu = new Menu();

			this.state = {
				resultId: props.resultId,
			};

			this.onResultSelectionChanged = this.#onResultSelectionChanged.bind(this);
			this.onRightButtonsUpdate = this.#onRightButtonsUpdate.bind(this);
			this.onClose = this.#onClose.bind(this);
		}

		render()
		{
			return View(
				{
					safeArea: {
						bottom: true,
					},
					resizableByKeyboard: true,
				},
				ViewContent({
					taskId: this.props.taskId,
					resultId: this.state.resultId,
					isFocused: this.props.isFocused,
					isWithAnotherResultsEmptyState: this.props.isWithAnotherResultsEmptyState,
					layoutWidget: this.#layoutWidget,
					layoutParentWidget: this.props.layoutParentWidget,
					onSave: this.props.onSave,
					onResultSelectionChanged: this.onResultSelectionChanged,
					onRightButtonsUpdate: this.onRightButtonsUpdate,
					onClose: this.onClose,
				}),
			);
		}

		/**
		 * @private
		 * @param {number} resultId
		 */
		#onResultSelectionChanged(resultId)
		{
			this.setState({ resultId });
		}

		/**
		 * @private
		 * @param {object} result
		 * @param {TextEditor} textEditorRef
		 */
		#onRightButtonsUpdate(result, textEditorRef)
		{
			const rightButtons = [];

			if (this.#isCreator(result))
			{
				rightButtons.push({
					type: 'more',
					callback: () => {
						this.menu.show({
							onUpdate: () => textEditorRef?.getTextInput().focus(),
							onRemove: () => {
								confirmDestructiveAction({
									title: Loc.getMessage('TASKS_FIELDS_RESULT_V2_VIEW_REMOVE_CONFIRM_TITLE'),
									description: Loc.getMessage('TASKS_FIELDS_RESULT_V2_VIEW_REMOVE_CONFIRM_DESCRIPTION'),
									destructionText: Loc.getMessage('TASKS_FIELDS_RESULT_V2_VIEW_REMOVE_CONFIRM_YES'),
									onDestruct: () => this.#onRemove(result),
								});
							},
						});
					},
				});
			}

			this.#layoutWidget.setRightButtons(rightButtons);
		}

		/**
		 * @private
		 * @param {object} result
		 */
		#onRemove(result)
		{
			const { taskId, onRemove } = this.props;
			const results = selectResultsByTaskId(store.getState(), taskId);

			if (results.length === 1)
			{
				onRemove(result.id, taskId);
				this.#onClose();

				return;
			}

			const resultIndex = results.findIndex((item) => item.id === result.id);
			if (resultIndex !== -1)
			{
				const isLastResult = (resultIndex === results.length - 1);
				const indexToSelect = (isLastResult ? resultIndex - 1 : resultIndex + 1);

				this.setState({ resultId: results[indexToSelect].id }, () => onRemove(result.id, taskId));
			}
		}

		#onClose()
		{
			this.#layoutWidget.close();
		}

		/**
		 * @private
		 * @param {object} result
		 * @returns {boolean}
		 */
		#isCreator(result)
		{
			return Number(result?.authorId) === Number(env.userId);
		}

		get #layoutWidget()
		{
			return this.props.layoutWidget;
		}
	}

	TaskResultView.propTypes = {
		taskId: PropTypes.number.isRequired,
		resultId: PropTypes.number.isRequired,
		isFocused: PropTypes.bool,
		isWithAnotherResultsEmptyState: PropTypes.bool,
		layoutWidget: PropTypes.object.isRequired,
		layoutParentWidget: PropTypes.object.isRequired,
		onSave: PropTypes.func.isRequired,
		onRemove: PropTypes.func.isRequired,
	};

	module.exports = { TaskResultView };
});
