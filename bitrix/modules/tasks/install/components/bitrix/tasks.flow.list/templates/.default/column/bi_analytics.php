<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\BIConnector\Access\AccessController;
use Bitrix\BIConnector\Access\ActionDictionary;
use Bitrix\BIConnector\Configuration\Feature;
use Bitrix\Main\Loader;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\Web\Json;
use Bitrix\Tasks\Flow\Integration\AI\Configuration;

if (!function_exists('renderBIAnalyticsColumn'))
{
	function renderBIAnalyticsColumn(array $data, array $arResult, bool $isActive): string
	{
		$disableClass = $isActive ? '' : '--disable';
		$efficiencyClass = '';
		$efficiencyText = Loc::getMessage('TASKS_FLOW_LIST_BI_ANALYTICS_GREAT');

		$efficiency = $data['efficiency'];

		if ($efficiency <= Configuration::getMaxValueForLowEfficiency())
		{
			$efficiencyClass = '--danger';
			$efficiencyText = Loc::getMessage('TASKS_FLOW_LIST_BI_ANALYTICS_BADLY');
		}

		$dashboards = $data['dashboards'];
		$isDashboardsExist = $data['isDashboardsExist'];
		$flowId = $data['flowId'];

		$onclick = getBIOnclick($dashboards, $flowId);
		$hint =getBIEmptyHint($dashboards, $isDashboardsExist);

		return <<<HTML
			<div class="tasks-flow__list-cell $disableClass">
				<div class="tasks-flow__list-analytics" $hint>
					<div class="tasks-flow__analytics-icon $efficiencyClass"></div>
					<div class="tasks-flow__analytics-text" onclick='$onclick'>$efficiencyText</div>
			</div>
		HTML;
	}
}

if (!function_exists('getBIOnclick'))
{
	function getBIOnclick(array $dashboards, int $flowId): string
	{
		if (empty($dashboards))
		{
			return '';
		}

		$jsonDashboards = Json::encode($dashboards);

		$manyDashboards = count($dashboards) > 1;

		if ($manyDashboards)
		{
			return "
				BX.Tasks.Flow.BIAnalytics.create({
					dashboards: {$jsonDashboards},
					target: this,
					flowId: {$flowId},
				}).openMenu();
			";
		}

		return "
			BX.Tasks.Flow.BIAnalytics.create({
				dashboards: {$jsonDashboards},
				target: this,
				flowId: {$flowId},
			}).openFirstDashboard();
		";
	}
}

if (!function_exists('getBIEmptyHint'))
{
	function getBIEmptyHint(array $dashboards, bool $isDashboardsExist): string
	{
		if (!empty($dashboards))
		{
			if (count($dashboards) === 1)
			{
				return getHint(Loc::getMessage(
					'TASKS_FLOW_LIST_BI_ANALYTICS_BY_REPORT',
					[
						'#DASHBOARD_TITLE#' => reset($dashboards)['title'],
					],
				));
			}

			return '';
		}

		if (
			Loader::includeModule('biconnector')
			&& !Feature::isBuilderEnabled()
		)
		{
			return getHint(Loc::getMessage('TASKS_FLOW_LIST_BI_CONSTRUCTOR_TARIFF_ERROR'));
		}

		if (
			Loader::includeModule('biconnector')
			&& !AccessController::getCurrent()->check(ActionDictionary::ACTION_BIC_ACCESS)
		)
		{
			return getHint(Loc::getMessage('TASKS_FLOW_LIST_BI_CONSTRUCTOR_NO_ACCESS'));
		}

		if (!$isDashboardsExist)
		{
			return getHint(Loc::getMessage('TASKS_FLOW_LIST_BI_ANALYTICS_NO_AVAILABLE_REPORTS'));
		}

		return getHint(Loc::getMessage('TASKS_FLOW_LIST_BI_ANALYTICS_EMPTY_DASHBOARDS'));
	}
}

if (!function_exists('getHint'))
{
	function getHint(string $hintText): string
	{
		if (empty($hintText))
		{
			return '';
		}

		return 'data-hint="'
			. htmlspecialcharsbx($hintText)
			. '" data-hint-no-icon'
		;
	}
}
