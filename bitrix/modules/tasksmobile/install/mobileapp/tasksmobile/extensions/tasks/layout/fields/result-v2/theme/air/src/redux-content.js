/**
 * @module tasks/layout/fields/result-v2/theme/air/src/redux-content
 */
jn.define('tasks/layout/fields/result-v2/theme/air/src/redux-content', (require, exports, module) => {
	const { Color, Indent } = require('tokens');
	const { Card, CardDesign } = require('ui-system/layout/card');
	const { PureComponent } = require('layout/pure-component');
	const { Loc } = require('loc');
	const { Text4 } = require('ui-system/typography/text');
	const { IconView, Icon } = require('ui-system/blocks/icon');
	const { Avatar } = require('ui-system/blocks/avatar');
	const { FileField } = require('layout/ui/fields/file');
	const { Circle, Line } = require('utils/skeleton');
	const { confirmDestructiveAction } = require('alert');
	const { CollapsibleText } = require('layout/ui/collapsible-text');
	const { UserName } = require('layout/ui/user/user-name');
	const { PlainTextFormatter } = require('bbcode/formatter/plain-text-formatter');
	const { Menu } = require('tasks/layout/fields/result-v2/menu');
	const { FriendlyDate } = require('layout/ui/friendly-date');
	const { FormatterTypes } = require('layout/ui/friendly-date/formatter-factory');

	const { connect } = require('statemanager/redux/connect');
	const { selectByTaskIdOrGuid } = require('tasks/statemanager/redux/slices/tasks');
	const { selectLastResult } = require('tasks/statemanager/redux/slices/tasks-results-v2');

	class ReduxContent extends PureComponent
	{
		constructor(props)
		{
			super(props);

			this.menu = new Menu();
		}

		/**
		 * @returns {TaskResultField}
		 */
		get #field()
		{
			return this.props.field;
		}

		/**
		 * @returns {string}
		 */
		get #testId()
		{
			return this.#field.testId;
		}

		/**
		 * @returns {object}
		 */
		get #result()
		{
			return this.props.result;
		}

		#openResult(forceFocus = false)
		{
			this.#field.openResult(this.#result.id, forceFocus);
		}

		render()
		{
			if (this.props.resultsCount === 0)
			{
				return View();
			}

			return View(
				{
					ref: this.#field.bindContainerRef,
				},
				Card(
					{
						testId: this.#testId,
						style: {
							borderWidth: 1,
							borderColor: (this.#result ? Color.accentMainPrimary.toHex() : Color.base6.toHex()),
							zIndex: 2,
						},
						design: CardDesign.PRIMARY,
						badgeMode: null,
						hideCross: true,
						onClick: () => this.#openResult(),
					},
					this.#renderHeader(),
					this.#renderCreator(),
					this.#renderText(),
					this.#renderFiles(),
				),
				Card(
					{
						style: {
							zIndex: 1,
							marginTop: -22,
							backgroundColor: Color.bgContentTertiary.toHex(),
						},
						badgeMode: null,
						hideCross: true,
						testId: `${this.#testId}_BUTTONS`,
					},
					this.#renderMoreButton(),
					this.#renderAddButton(),
				),
			);
		}

		#renderHeader()
		{
			return View(
				{
					style: {
						flexDirection: 'row',
						justifyContent: 'space-between',
						alignItems: 'center',
						paddingBottom: Indent.L.toNumber(),
						borderBottomWidth: 1,
						borderBottomColor: Color.bgSeparatorSecondary.toHex(),
					},
					testId: `${this.#testId}_HEADER`,
				},
				View(
					{
						style: {
							flexDirection: 'row',
						},
					},
					IconView({
						icon: Icon.WINDOW_FLAG,
						color: (this.#result ? Color.accentMainPrimary : Color.base6),
						size: 24,
					}),
					View(
						{
							style: {
								marginLeft: Indent.XS.toNumber(),
							},
						},
						Text4({
							text: Loc.getMessage('TASKS_FIELDS_RESULT_V2_AIR_TITLE'),
							accent: true,
						}),
						this.#result && new FriendlyDate({
							style: {
								color: Color.base3.toHex(),
							},
							formatType: FormatterTypes.HUMAN_DATE,
							timeSeparator: '',
							showTime: true,
							useTimeAgo: true,
							timestamp: this.#result.createdAtTs,
							testId: `${this.#testId}_DATE`,
						}),
						!this.#result && Line(90, 8, 7),
					),
				),
				this.#isCreator() && IconView({
					icon: Icon.MORE,
					color: Color.base5,
					forwardRef: (ref) => {
						this.moreButtonRef = ref;
					},
					onClick: () => {
						this.menu.show({
							target: this.moreButtonRef,
							onUpdate: () => this.#openResult(true),
							onRemove: () => {
								confirmDestructiveAction({
									title: Loc.getMessage('TASKS_FIELDS_RESULT_V2_AIR_REMOVE_CONFIRM_TITLE'),
									description: Loc.getMessage('TASKS_FIELDS_RESULT_V2_AIR_REMOVE_CONFIRM_DESCRIPTION'),
									destructionText: Loc.getMessage('TASKS_FIELDS_RESULT_V2_AIR_REMOVE_CONFIRM_YES'),
									onDestruct: () => this.#field.removeResult(this.#result.id),
								});
							},
						});
					},
				}),
			);
		}

		#renderCreator()
		{
			if (!this.#result)
			{
				return View(
					{
						style: {
							flexDirection: 'row',
							marginTop: Indent.XL.toNumber(),
							alignItems: 'center',
						},
					},
					Circle(32),
					View(
						{
							style: {
								marginLeft: Indent.M.toNumber(),
							},
						},
						Line(150, 8),
					),
				);
			}

			const userId = this.#result.authorId;

			return View(
				{
					style: {
						flexDirection: 'row',
						marginTop: Indent.XL.toNumber(),
						alignItems: 'center',
					},
				},
				Avatar({
					id: userId,
					size: 32,
					testId: `${this.#testId}_CREATOR_AVATAR`,
					withRedux: true,
				}),
				UserName({
					style: {
						marginLeft: Indent.M.toNumber(),
					},
					id: userId,
					testId: `${this.#testId}_CREATOR_NAME`,
					withRedux: true,
				}),
			);
		}

		#renderText()
		{
			if (!this.#result)
			{
				return View(
					{
						style: {
							marginTop: Indent.M.toNumber(),
						},
					},
					...Array.from({ length: 3 }).fill(
						Line('100%', 8, 9),
					),
				);
			}

			const plainTextFormatter = new PlainTextFormatter();
			const plainAst = plainTextFormatter.format({
				source: this.#result.text,
				data: {
					files: this.#result.files ?? [],
				},
			});

			return new CollapsibleText({
				containerStyle: {
					marginTop: Indent.M.toNumber(),
				},
				style: {
					fontSize: 15,
					fontWeight: '400',
					color: Color.base2.toHex(),
				},
				value: plainAst.toString(),
				bbCodeMode: false,
				canExpand: false,
				testId: `${this.#testId}_TEXT`,
				onClick: () => this.#openResult(),
				onLongClick: () => this.#openResult(),
				onLinkClick: () => this.#openResult(),
			});
		}

		#renderFiles()
		{
			if (!this.#result)
			{
				return FileField({
					readOnly: true,
					showEditIcon: false,
					hasHiddenEmptyView: false,
					showTitle: false,
					showFilesName: true,
					multiple: true,
					value: [],
					config: {
						parentWidget: this.#field.parentWidget,
						isShimmed: true,
					},
				});
			}

			if (this.#result.files.length === 0)
			{
				return null;
			}

			return FileField({
				readOnly: true,
				showEditIcon: false,
				hasHiddenEmptyView: false,
				showTitle: false,
				showFilesName: true,
				multiple: true,
				value: this.#result.files,
				config: {
					parentWidget: this.#field.parentWidget,
				},
				testId: `${this.#testId}_FILES`,
			});
		}

		#renderMoreButton()
		{
			if (!this.#shouldShowMoreButton())
			{
				return null;
			}

			const resultsCountToShowMore = this.props.resultsCount - 1;

			return View(
				{
					style: {
						flexDirection: 'row',
						justifyContent: 'space-between',
						alignItems: 'center',
						marginTop: Indent.XL3.toNumber(),
						paddingBottom: Indent.L.toNumber(),
						borderBottomWidth: 1,
						borderBottomColor: Color.bgSeparatorSecondary.toHex(),
					},
					testId: `${this.#testId}-more-button-container`,
					onClick: (this.#result ? () => this.#field.openResultList() : () => {}),
				},
				this.#result && Text4({
					color: Color.base4,
					text: Loc.getMessagePlural(
						'TASKS_FIELDS_RESULT_V2_AIR_SHOW_MORE',
						resultsCountToShowMore,
						{ '#COUNT#': resultsCountToShowMore },
					),
					testId: `${this.#testId}-more-button-field`,
				}),
				!this.#result && Line(186, 8, 8),
				IconView({
					icon: Icon.CHEVRON_TO_THE_RIGHT,
					color: Color.base5,
					size: 24,
				}),
			);
		}

		#renderAddButton()
		{
			return View(
				{
					style: {
						flexDirection: 'row',
						justifyContent: 'space-between',
						alignItems: 'center',
						marginTop: this.#shouldShowMoreButton() ? Indent.L.toNumber() : Indent.XL3.toNumber(),
					},
					testId: `${this.#testId}-add-button-container`,
					onClick: () => this.#field.openResultCreation(),
				},
				Text4({
					color: Color.base4,
					text: Loc.getMessage('TASKS_FIELDS_RESULT_V2_AIR_ADD_RESULT'),
					testId: `${this.#testId}-add-button-field`,
				}),
				IconView({
					icon: Icon.PLUS,
					color: Color.base5,
					size: 24,
				}),
			);
		}

		#isCreator()
		{
			return Number(this.#result?.authorId) === Number(env.userId);
		}

		#shouldShowMoreButton()
		{
			return this.props.resultsCount > 1;
		}
	}

	const mapStateToProps = (state, ownProps) => {
		const taskId = ownProps.field.taskId;
		const result = selectLastResult(state, taskId);
		const { resultsCount } = selectByTaskIdOrGuid(state, taskId);

		if (!result)
		{
			return {
				result,
				resultsCount,
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
			result: {
				id,
				messageId,
				authorId,
				createdAtTs,
				status,
				text,
				files,
			},
			resultsCount,
		};
	};

	module.exports = {
		TaskResultAirReduxContent: connect(mapStateToProps)(ReduxContent),
	};
});
