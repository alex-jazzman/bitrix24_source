/**
 * @bxjs_lang_path extension.php
 * @module crm/kanban/toolbar/compact-stage-control
 */
jn.define('crm/kanban/toolbar/compact-stage-control', (require, exports, module) => {
	const { Filler } = require('layout/ui/kanban/toolbar');
	const { Loc } = require('loc');
	const { Money } = require('money');
	const { connect } = require('statemanager/redux/connect');
	const { Color, Indent } = require('tokens');
	const { Icon, IconView } = require('ui-system/blocks/icon');
	const { Text5, Text4 } = require('ui-system/typography/text');

	const { getCrmKanbanUniqId } = require('crm/statemanager/redux/slices/kanban-settings');
	const {
		selectById: selectCounterById,
		selectStatus: selectCountersStatus,
		statusTypes,
	} = require('crm/statemanager/redux/slices/stage-counters');
	const {
		selectById: selectStageById,
	} = require('crm/statemanager/redux/slices/stage-settings');

	const MAX_FORMATTED_SUM = 1_000_000_000;
	const COUNT_SUM_SEPARATOR = '/';
	const STAGE_ICON_SIZE = 24;
	const CHEVRON_SIZE = 18;
	const COUNT_FILLER_WIDTH = 24;
	const SUM_FILLER_WIDTH = 78;

	const CONTROL_HEIGHT = 51;
	const CONTROL_CORNER = 12;

	const compactStyles = {
		rootWrapper: {
			backgroundColor: Color.bgContentPrimary.toHex(),
			paddingTop: Indent.M.toNumber(),
			paddingHorizontal: Indent.XL3.toNumber(),
		},
		mainWrapper: {
			height: CONTROL_HEIGHT,
			paddingTop: 0,
			paddingHorizontal: Indent.L.toNumber(),
			alignItems: 'center',
			backgroundColor: Color.bgContentSecondary.toHex(),
			borderWidth: 1,
			borderColor: Color.bgSeparatorPrimary.toHex(),
			borderRadius: CONTROL_CORNER,
		},
	};

	const styles = {
		info: {
			flex: 1,
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'space-between',
		},
		stage: {
			flex: 1,
			flexDirection: 'row',
			alignItems: 'center',
		},
		summary: {
			flexDirection: 'row',
			alignItems: 'center',
			marginLeft: Indent.L.toNumber(),
		},
	};

	const StageIcon = () => IconView({
		testId: 'compactStageControlIcon',
		icon: Icon.STAGES,
		color: Color.base3,
		size: STAGE_ICON_SIZE,
		style: {
			marginRight: Indent.S.toNumber(),
		},
	});

	const StageTitle = (activeStage) => Text4({
		testId: 'compactStageControlStageName',
		text: (activeStage ? activeStage.name : Loc.getMessage('MCRM_STAGE_TOOLBAR_COMPACT_ALL_STAGES')),
		color: Color.base1,
		numberOfLines: 1,
		ellipsize: 'end',
		style: {
			flexShrink: 2,
		},
	});

	const StageChevron = () => IconView({
		testId: 'compactStageControlChevron',
		icon: Icon.CHEVRON_DOWN,
		color: Color.base4,
		size: CHEVRON_SIZE,
		style: {
			marginLeft: Indent.XS.toNumber(),
		},
	});

	const StageCount = ({ counter, isLoading, withSeparator }) => {
		if (isLoading)
		{
			return Filler(COUNT_FILLER_WIDTH);
		}

		const count = (counter ? counter.count : 0);

		return Text5({
			testId: 'compactStageControlCount',
			text: (withSeparator ? `${count} ${COUNT_SUM_SEPARATOR}` : String(count)),
			color: Color.base3,
			numberOfLines: 1,
		});
	};

	/**
	 * @param {Money} money
	 * @return {string}
	 */
	const formatTotal = (money) => {
		if (money.amount < MAX_FORMATTED_SUM)
		{
			return money.formatted;
		}

		const compact = Math.floor((money.amount * 10) / MAX_FORMATTED_SUM) / 10;

		return `${compact} ${Loc.getMessage('M_CRM_MAX_FORMATTED_SUM')} ${money.formattedCurrency}`.trim();
	};

	const StageSum = ({ counter, isLoading }) => {
		if (isLoading)
		{
			return Filler(SUM_FILLER_WIDTH, { marginLeft: Indent.XS.toNumber() });
		}

		if (!counter)
		{
			return null;
		}

		const money = new Money({ amount: counter.total, currency: counter.currency });

		return Text4({
			testId: 'compactStageControlSum',
			text: formatTotal(money),
			color: Color.base1,
			numberOfLines: 1,
			ellipsize: 'end',
			style: {
				marginLeft: Indent.XS.toNumber(),
			},
		});
	};

	/**
	 * Single-row stage panel of the compact list view.
	 */
	const CompactStageControlView = ({ activeStage, counter, isLoading, showSum }) => View(
		{
			style: styles.info,
		},
		View(
			{
				style: styles.stage,
			},
			StageIcon(),
			StageTitle(activeStage),
			StageChevron(),
		),
		View(
			{
				style: styles.summary,
			},
			StageCount({ counter, isLoading, withSeparator: showSum }),
			(showSum && StageSum({ counter, isLoading })),
		),
	);

	const mapStateToProps = (state, ownProps) => {
		const { entityTypeId, categoryId, activeStageId } = ownProps;
		const counterId = activeStageId || getCrmKanbanUniqId(entityTypeId, categoryId);

		return {
			activeStage: selectStageById(state, activeStageId),
			counter: selectCounterById(state, counterId),
			isLoading: selectCountersStatus(state) !== statusTypes.success,
		};
	};

	module.exports = {
		CompactStageControl: connect(mapStateToProps)(CompactStageControlView),
		compactStyles,
	};
});
