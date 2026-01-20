/**
 * @module tasks/layout/fields/result-v2/view/src/view-content
 */
jn.define('tasks/layout/fields/result-v2/view/src/view-content', (require, exports, module) => {
	const { PureComponent } = require('layout/pure-component');
	const { TextEditor } = require('text-editor');
	const { Loc } = require('loc');
	const { Indent, Color } = require('tokens');
	const { ChipButton, ChipButtonDesign, ChipButtonMode } = require('ui-system/blocks/chips/chip-button');
	const { Text5 } = require('ui-system/typography/text');
	const { ButtonSize, ButtonDesign, Button } = require('ui-system/form/buttons/button');
	const { Avatar } = require('ui-system/blocks/avatar');
	const { UIScrollView } = require('layout/ui/scroll-view');
	const { Circle, Line } = require('utils/skeleton');
	const { ActionId, ActionMeta } = require('tasks/layout/action-menu/actions');
	const { FriendlyDate } = require('layout/ui/friendly-date');
	const { FormatterTypes } = require('layout/ui/friendly-date/formatter-factory');
	const { useCallback } = require('utils/function');
	const { PropTypes } = require('utils/validation');

	const { dispatch } = require('statemanager/redux/store');
	const { connect } = require('statemanager/redux/connect');
	const { selectById: selectTaskById, selectActions } = require('tasks/statemanager/redux/slices/tasks');
	const { getAll, selectResultsByTaskId, selectResultById } = require('tasks/statemanager/redux/slices/tasks-results-v2');

	class ViewContent extends PureComponent
	{
		constructor(props)
		{
			super(props);

			/** @type {null|TextEditor} */
			this.textEditorRef = null;

			/** @type {null|ScrollView} */
			this.scrollRef = null;

			/** @type {Map<number, ChipButton>} */
			this.chipsRefs = new Map();

			/** @type {Map<number, number>} */
			this.chipsWidth = new Map();

			this.state = {
				isFocused: props.isFocused,
				isWithAnotherResultsEmptyState: props.isWithAnotherResultsEmptyState,
				files: this.#result.files,
			};
		}

		componentDidMount()
		{
			const { taskId, onRightButtonsUpdate } = this.props;
			const { isWithAnotherResultsEmptyState, isFocused } = this.state;

			if (!isWithAnotherResultsEmptyState)
			{
				this.#scrollToResult(this.#result.id);
			}

			if (isFocused)
			{
				this.textEditorRef.getTextInput().focus();
			}

			onRightButtonsUpdate(this.#result, this.textEditorRef);

			dispatch(
				getAll({ taskId }),
			)
				.then(() => {
					if (isWithAnotherResultsEmptyState)
					{
						setTimeout(() => {
							this.setState(
								{ isWithAnotherResultsEmptyState: false },
								() => this.#scrollToResult(this.#result.id),
							);
						}, 100);
					}
				})
				.catch(console.error)
			;
		}

		componentWillReceiveProps(props)
		{
			const { result } = props;
			if (result)
			{
				this.props.onRightButtonsUpdate(result, this.textEditorRef);
				this.#scrollToResult(result.id);
				this.state.files = result.files;
			}
		}

		#scrollToResult(resultId)
		{
			setTimeout(() => {
				const position = this.scrollRef?.getPosition(this.chipsRefs.get(resultId));
				if (position)
				{
					this.scrollRef?.scrollTo({
						x: position.x - device.screen.width / 2 + (this.chipsWidth.get(resultId) || 0) / 2,
						y: position.y,
						animated: true,
					});
				}
			}, 100);
		}

		get #testId()
		{
			return `TASK_RESULT_VIEW_${this.#result.id}`;
		}

		get #result()
		{
			return this.props.result;
		}

		get #isCreator()
		{
			return Number(this.#result.authorId) === Number(env.userId);
		}

		render()
		{
			if (!this.#result.id)
			{
				return View();
			}

			return View(
				{
					style: {
						flex: 1,
					},
					testId: this.#testId,
				},
				this.#renderTextEditor(),
				this.#renderAnotherResults(),
				this.#renderActionButton(),
			);
		}

		#renderTextEditor()
		{
			const { taskId, layoutWidget, onSave } = this.props;

			return View(
				{
					style: {
						flex: 1,
					},
					testId: `${this.#testId}_EDITOR`,
				},
				new TextEditor({
					ref: (ref) => {
						this.textEditorRef = ref;
					},
					view: {
						style: {
							flex: 1,
						},
					},
					textInput: {
						style: {
							flex: 1,
						},
						placeholder: Loc.getMessage('TASKS_FIELDS_RESULT_V2_VIEW_ADD_WIDGET_PLACEHOLDER'),
					},
					readOnly: !this.#isCreator,
					value: this.#result.text,
					fileField: {
						config: {
							controller: {
								endpoint: 'disk.uf.integration.diskUploaderController',
							},
							disk: {
								isDiskModuleInstalled: true,
								isWebDavModuleInstalled: true,
								fileAttachPath: `/mobile/?mobile_action=disk_folder_list&type=user&path=%2F&entityId=${env.userId}`,
							},
						},
						value: this.state.files,
						onChange: (files) => this.setState({ files }),
					},
					parentWidget: layoutWidget,
					onFocus: () => this.setState({ isFocused: true }),
					onBlur: () => this.setState({ isFocused: false }),
					onSave: ({ bbcode: text, files }) => onSave?.({ text, files, id: this.#result.id }, taskId),
				}),
			);
		}

		#renderAnotherResults()
		{
			const { results } = this.props;
			console.log(results);
			const { isWithAnotherResultsEmptyState, isFocused } = this.state;

			if (!isWithAnotherResultsEmptyState && results.length <= 1)
			{
				return null;
			}

			return View(
				{
					style: {
						display: (isFocused ? 'none' : 'flex'),
						paddingVertical: Indent.L.toNumber(),
					},
				},
				Text5({
					style: {
						marginLeft: Indent.XL4.toNumber(),
					},
					color: Color.base3,
					text: Loc.getMessage('TASKS_FIELDS_RESULT_V2_VIEW_ANOTHER_RESULTS'),
				}),
				UIScrollView(
					{
						style: {
							height: 32,
							marginTop: Indent.XL.toNumber(),
						},
						horizontal: true,
						showsHorizontalScrollIndicator: false,
						ref: (ref) => {
							this.scrollRef = ref;
						},
					},
					isWithAnotherResultsEmptyState && View(
						{
							style: {
								flexDirection: 'row',
								paddingHorizontal: Indent.XL4.toNumber(),
							},
							testId: `${this.#testId}_ANOTHER_RESULTS`,
						},
						...Array.from({ length: 2 }, () => this.#renderEmptyResultChip()),
					),
					!isWithAnotherResultsEmptyState && View(
						{
							style: {
								flexDirection: 'row',
								paddingHorizontal: Indent.XL4.toNumber(),
							},
							testId: `${this.#testId}_ANOTHER_RESULTS`,
						},
						...results.map((result) => this.#renderResultChip(result)),
					),
				),
			);
		}

		#renderEmptyResultChip()
		{
			return ChipButton({
				style: {
					marginRight: Indent.L.toNumber(),
				},
				design: ChipButtonDesign.GREY,
				mode: ChipButtonMode.OUTLINE,
				rounded: false,
				content: View(
					{
						style: {
							flexDirection: 'row',
							alignItems: 'center',
						},
					},
					Circle(20),
					View(
						{
							style: {
								marginLeft: Indent.M.toNumber(),
							},
						},
						Line(150, 5),
					),
				),
			});
		}

		#renderResultChip(result)
		{
			const isSelected = (result.id === this.#result.id);
			const date = new FriendlyDate({
				style: {
					marginLeft: Indent.XS.toNumber(),
					color: (isSelected ? Color.accentMainPrimary.toHex() : Color.base3.toHex()),
				},
				formatType: FormatterTypes.HUMAN_DATE,
				timeSeparator: '',
				showTime: true,
				useTimeAgo: true,
				timestamp: result.createdAtTs,
				testId: `${this.#testId}_ANOTHER_RESULTS_CHIP_${result.id}_DATE`,
			});

			return ChipButton({
				style: {
					marginRight: Indent.L.toNumber(),
				},
				design: isSelected ? ChipButtonDesign.PRIMARY : ChipButtonDesign.GREY,
				mode: ChipButtonMode.OUTLINE,
				rounded: false,
				avatar: Avatar({
					id: result.authorId,
					size: 20,
					testId: `${this.#testId}_ANOTHER_RESULTS_CHIP_${result.id}_AVATAR`,
					withRedux: true,
				}),
				text: date.makeText(date.moment),
				testId: `${this.#testId}_ANOTHER_RESULTS_CHIP_${result.id}`,
				onClick: useCallback(() => this.#onResultChipClick(result.id)),
				onLayout: useCallback(({ width }) => this.#onResultChipLayout(width, result.id)),
				forwardRef: useCallback((ref) => this.#onResultChipForwardRef(ref, result.id)),
			});
		}

		#onResultChipClick(resultId)
		{
			if (resultId !== this.#result.id)
			{
				this.props.onResultSelectionChanged(resultId);
			}
		}

		#onResultChipForwardRef(ref, resultId)
		{
			this.chipsRefs.set(resultId, ref);
		}

		#onResultChipLayout(width, resultId)
		{
			this.chipsWidth.set(resultId, width);
		}

		#renderActionButton()
		{
			const { taskId, taskActions, layoutParentWidget, onClose } = this.props;

			const completeActionMeta = ActionMeta[ActionId.COMPLETE];
			const approveActionMeta = ActionMeta[ActionId.APPROVE];
			const disapproveActionMeta = ActionMeta[ActionId.DISAPPROVE];

			const completeButtonText = Loc.getMessage('TASKS_FIELDS_RESULT_V2_VIEW_ACTION_COMPLETE');
			console.log(completeButtonText);

			return View(
				{
					style: {
						display: (this.state.isFocused ? 'none' : 'flex'),
						flexDirection: 'row',
						paddingVertical: Indent.XL.toNumber(),
						paddingHorizontal: Indent.XL4.toNumber(),
					},
				},
				taskActions[ActionId.COMPLETE] && Button({
					text: completeButtonText,
					size: ButtonSize.L,
					design: ButtonDesign.FILLED,
					leftIcon: (completeActionMeta.getData().outlineIconContent ?? ''),
					stretched: true,
					testId: `${this.#testId}_ACTION_BUTTON_COMPLETE`,
					onClick: async () => {
						await completeActionMeta.handleAction({ taskId, layout: layoutParentWidget });
						onClose?.();
					},
				}),
				taskActions[ActionId.APPROVE] && Button({
					style: {
						flex: 1,
					},
					text: approveActionMeta.title(),
					size: ButtonSize.M,
					design: ButtonDesign.OUTLINE_ACCENT_2,
					leftIcon: (approveActionMeta.getData().outlineIconContent ?? ''),
					leftIconColor: Color.accentMainSuccess,
					color: Color.accentMainSuccess,
					borderColor: Color.accentMainSuccess,
					stretched: true,
					testId: `${this.#testId}_ACTION_BUTTON_APPROVE`,
					onClick: () => {
						approveActionMeta.handleAction({ taskId, layout: layoutParentWidget });
						onClose?.();
					},
				}),
				taskActions[ActionId.DISAPPROVE] && Button({
					style: {
						flex: 1,
						marginLeft: Indent.L.toNumber(),
					},
					text: disapproveActionMeta.title(),
					size: ButtonSize.M,
					design: ButtonDesign.OUTLINE_NO_ACCENT,
					leftIcon: (disapproveActionMeta.getData().outlineIconContent ?? ''),
					stretched: true,
					testId: `${this.#testId}_ACTION_BUTTON_DISAPPROVE`,
					onClick: () => {
						disapproveActionMeta.handleAction({ taskId, layout: layoutParentWidget });
						onClose?.();
					},
				}),
			);
		}
	}

	ViewContent.propTypes = {
		taskId: PropTypes.number.isRequired,
		resultId: PropTypes.number.isRequired,
		isFocused: PropTypes.bool.isRequired,
		isWithAnotherResultsEmptyState: PropTypes.bool.isRequired,
		layoutWidget: PropTypes.object.isRequired,
		layoutParentWidget: PropTypes.object.isRequired,
		onSave: PropTypes.func.isRequired,
		onResultSelectionChanged: PropTypes.func.isRequired,
		onRightButtonsUpdate: PropTypes.func.isRequired,
		onClose: PropTypes.func.isRequired,
		taskActions: PropTypes.object.isRequired,
		result: PropTypes.object.isRequired,
		results: PropTypes.array.isRequired,
	};

	const mapStateToProps = (state, ownProps) => {
		const result = selectResultById(state, ownProps.resultId);
		const actions = selectActions({ task: selectTaskById(state, ownProps.taskId) });
		const taskActions = {
			[ActionId.COMPLETE]: actions.complete,
			[ActionId.APPROVE]: actions.approve,
			[ActionId.DISAPPROVE]: actions.disapprove,
		};

		if (!result)
		{
			return {
				taskActions,
				result: {},
				results: [],
			};
		}

		const {
			id,
			messageId,
			authorId,
			createdAtTs,
			status,
			text,
			files,
		} = result;

		return {
			taskActions,
			result: {
				id,
				messageId,
				authorId,
				createdAtTs,
				status,
				text,
				files,
			},
			results: selectResultsByTaskId(state, ownProps.taskId),
		};
	};

	module.exports = {
		ViewContent: connect(mapStateToProps)(ViewContent),
	};
});
