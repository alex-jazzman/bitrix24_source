/**
 * @module crm/simple-list/items/crm-entity-compact/src/stage-chip
 */
jn.define('crm/simple-list/items/crm-entity-compact/src/stage-chip', (require, exports, module) => {
	const { connect } = require('statemanager/redux/connect');
	const { Color } = require('tokens');
	const { Icon } = require('ui-system/blocks/icon');
	const { ChipButton, ChipButtonDesign, ChipButtonMode } = require('ui-system/blocks/chips/chip-button');
	const { Type } = require('type');

	const {
		getCrmKanbanUniqId,
		selectStagesIdsBySemantics,
	} = require('crm/statemanager/redux/slices/kanban-settings');
	const {
		selectById: selectStageById,
	} = require('crm/statemanager/redux/slices/stage-settings');

	const STAGE_COLOR_PATTERN = /^#[\da-f]{3,8}$/i;

	// ChipButton only accepts color and design tokens, but the hex value comes from the backend,
	// so custom tokens are created once per color instead of once per render
	const stageDesignCache = new Map();

	/**
	 * @param {string} stageColor
	 * @return {?{color: Color, design: ChipButtonDesign}}
	 */
	const getStageDesign = (stageColor) => {
		if (!Type.isStringFilled(stageColor) || !STAGE_COLOR_PATTERN.test(stageColor))
		{
			return null;
		}

		if (!stageDesignCache.has(stageColor))
		{
			stageDesignCache.set(stageColor, {
				color: new Color(`customColor${stageColor}`, stageColor),
				design: new ChipButtonDesign(`customDesign${stageColor}`, {
					[ChipButtonMode.OUTLINE]: {
						borderWidth: 1,
						borderColor: stageColor,
						backgroundColor: Color.bgPrimary,
						color: Color.accentMainSuccess,
					},
				}),
			});
		}

		return stageDesignCache.get(stageColor);
	};

	/**
	 * Opens the same stage list the stage slider opens on a click on the active stage
	 */
	const openStageList = async (props) => {
		const { entityTypeId, categoryId, stageId, itemId, parentWidget, onStageSelect } = props;

		// eslint-disable-next-line no-undef
		const { CrmStageListView } = await requireLazy('crm:stage-list-view');

		void CrmStageListView.open(
			{
				entityTypeId,
				categoryId,
				kanbanSettingsId: getCrmKanbanUniqId(entityTypeId, categoryId),
				activeStageId: stageId,
				data: {
					itemId,
				},
				readOnly: true,
				canMoveStages: false,
				enableStageSelect: true,
				onStageSelect: (id, statusId) => onStageSelect(id, statusId),
			},
			parentWidget,
		);
	};

	/**
	 * Current stage of an item shown as a single chip instead of the stage slider
	 */
	const StageChipView = (props) => {
		const { stageName, stageColor, readOnly, testId } = props;

		if (!Type.isStringFilled(stageName))
		{
			return null;
		}

		const stageDesign = getStageDesign(stageColor);

		return ChipButton({
			testId,
			color: stageDesign?.color,
			design: stageDesign?.design ?? ChipButtonDesign.PRIMARY,
			text: stageName,
			icon: Icon.STAGE,
			compact: true,
			mode: ChipButtonMode.OUTLINE,
			onClick: (readOnly ? undefined : () => {
				void openStageList(props);
			}),
		});
	};

	const mapStateToProps = (state, ownProps) => {
		const { entityTypeId, categoryId, columnCode } = ownProps;
		const { processStages, successStages, failedStages } = selectStagesIdsBySemantics(
			state,
			getCrmKanbanUniqId(entityTypeId, categoryId),
		);

		const stage = [...processStages, ...successStages, ...failedStages]
			.map((id) => selectStageById(state, id))
			.find((item) => item && item.statusId === columnCode);

		return {
			stageId: stage?.id,
			stageName: stage?.name,
			stageColor: stage?.color,
		};
	};

	module.exports = { CompactStageChip: connect(mapStateToProps)(StageChipView) };
});
