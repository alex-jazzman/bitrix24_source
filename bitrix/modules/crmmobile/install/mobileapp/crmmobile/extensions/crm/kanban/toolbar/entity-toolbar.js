/**
 * @bxjs_lang_path extension.php
 * @module crm/kanban/toolbar/entity-toolbar
 */
jn.define('crm/kanban/toolbar/entity-toolbar', (require, exports, module) => {
	const { KanbanToolbar } = require('layout/ui/kanban/toolbar');
	const { Loc } = require('loc');
	const { mergeImmutable } = require('utils/object');

	const { connect } = require('statemanager/redux/connect');
	const {
		getCrmKanbanUniqId,
		selectById,
		selectStagesIdsBySemantics,
	} = require('crm/statemanager/redux/slices/kanban-settings');

	const { StageDropdown } = require('crm/kanban/toolbar/stage-dropdown');
	const { StageSummary } = require('crm/kanban/toolbar/stage-summary');
	const { CompactStageControl, compactStyles } = require('crm/kanban/toolbar/compact-stage-control');

	class EntityToolbar extends KanbanToolbar
	{
		constructor(props)
		{
			super(props);
			this.setDefaultStageHandler = this.setDefaultStage.bind(this);
		}

		get entityTypeId()
		{
			return BX.prop.getInteger(this.props, 'entityTypeId', null);
		}

		get filterParams()
		{
			return BX.prop.getObject(this.props, 'filterParams', {});
		}

		get categoryId()
		{
			return BX.prop.getInteger(this.filterParams, 'CATEGORY_ID', null);
		}

		get kanbanSettingsName()
		{
			return BX.prop.getString(this.props, 'kanbanSettingsName', '');
		}

		get categoriesEnabled()
		{
			return BX.prop.getBoolean(this.props, 'categoriesEnabled', false);
		}

		get isCompactView()
		{
			return BX.prop.getBoolean(this.props, 'isCompactView', false);
		}

		get allStagesId()
		{
			return getCrmKanbanUniqId(this.entityTypeId, this.categoryId);
		}

		componentWillReceiveProps(props)
		{
			if (!BX.prop.getBoolean(props, 'isCompactView', false))
			{
				return;
			}

			const activeStageId = this.getActiveStageId();
			const stageIds = BX.prop.getArray(props, 'stageIds', []);

			if (activeStageId && activeStageId !== this.allStagesId && !stageIds.includes(activeStageId))
			{
				this.setActiveStage(null);
			}
		}

		onToolbarClick()
		{
			void requireLazy('crm:stage-list-view').then(({ CrmStageListView }) => {
				const props = {
					entityTypeId: this.entityTypeId,
					kanbanSettingsId: this.allStagesId,
					categoryId: this.categoryId,
					activeStageId: this.getActiveStageId(),
					readOnly: true,
					canMoveStages: false,
					enableStageSelect: true,
					clickable: false,
					onStageSelect: this.setActiveStage.bind(this),
					stageParams: {
						showTotal: true,
						showCount: true,
						showCounters: true,
						showTunnels: false,
						showAllStagesItem: true,
					},
				};

				void CrmStageListView.open(props, this.layout);
			});
		}

		/**
		 * @returns {String}
		 */
		getStageSelectorTitle()
		{
			if (this.categoriesEnabled && this.kanbanSettingsName !== '')
			{
				return Loc.getMessage('MCRM_STAGE_TOOLBAR_CATEGORY_NAME2', {
					'#CATEGORY_NAME#': this.kanbanSettingsName,
				});
			}

			return Loc.getMessage('MCRM_STAGE_TOOLBAR_CURRENT_STAGE');
		}

		renderStageSelector()
		{
			const styles = this.getStyles();

			return View(
				{
					style: styles.stageSelectorWrapper,
				},
				StageDropdown({
					onClick: this.onToolbarClick,
					entityTypeId: this.entityTypeId,
					categoryId: this.categoryId,
					activeStageId: this.state.activeStageId,
					title: this.getStageSelectorTitle(),
					loading: this.isLoading(),
					setDefaultStage: this.setDefaultStageHandler,
				}),
			);
		}

		renderCurrentStageSummary()
		{
			if (!this.getProps().showSum)
			{
				return null;
			}

			return StageSummary({
				entityTypeId: this.entityTypeId,
				categoryId: this.categoryId,
				activeStageId: this.state.activeStageId,
			});
		}

		getTestId()
		{
			return (this.isCompactView ? 'compactStageControl' : 'stageToolbar');
		}

		getStyles()
		{
			const styles = super.getStyles();

			return (this.isCompactView ? mergeImmutable(styles, compactStyles) : styles);
		}

		/**
		 * The compact panel is a standalone card with indents, so the shadow of the attached toolbar is dropped
		 */
		renderContainer(...children)
		{
			if (!this.isCompactView)
			{
				return super.renderContainer(...children);
			}

			const styles = this.getStyles();

			return View(
				{
					style: styles.rootWrapper,
					testId: this.getTestId(),
					onClick: () => this.onToolbarClick(),
				},
				View(
					{
						style: styles.mainWrapper,
						ref: (ref) => {
							if (ref)
							{
								this.provideRef(ref);
							}
						},
					},
					...children,
				),
			);
		}

		render()
		{
			if (!this.isCompactView)
			{
				return super.render();
			}

			return this.renderContainer(
				CompactStageControl({
					entityTypeId: this.entityTypeId,
					categoryId: this.categoryId,
					activeStageId: this.getActiveStageId(),
					showSum: Boolean(this.getProps().showSum),
				}),
			);
		}

		setDefaultStage()
		{
			this.onChangeStage(getCrmKanbanUniqId(this.entityTypeId, this.categoryId));
		}
	}

	const mapStateToProps = (state, ownProps) => {
		const {
			entityTypeId,
			filterParams: {
				CATEGORY_ID: categoryId,
			},
		} = ownProps;

		const id = getCrmKanbanUniqId(entityTypeId, categoryId);

		const {
			categoriesEnabled = false,
			name = '',
		} = selectById(state, id) || {};

		const {
			processStages,
			successStages,
			failedStages,
		} = selectStagesIdsBySemantics(state, id);

		return {
			categoriesEnabled,
			kanbanSettingsName: name,
			stageIds: [...processStages, ...successStages, ...failedStages],
		};
	};

	module.exports = {
		EntityToolbar: connect(mapStateToProps)(EntityToolbar),
	};
});
