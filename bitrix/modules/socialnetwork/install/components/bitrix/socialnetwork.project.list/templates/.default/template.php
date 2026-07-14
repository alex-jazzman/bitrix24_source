<?php

declare(strict_types=1);

if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

/**
 * @var CMain $APPLICATION
 * @var array $arResult
 * @var array $arParams
 */

use Bitrix\Main\Loader;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\UI\Extension;
use Bitrix\Main\Web\Json;
use Bitrix\Tasks\UI\ScopeDictionary;
use Bitrix\Socialnetwork\Component\WorkgroupList;
use Bitrix\Socialnetwork\Integration\Intranet\Settings;

Extension::load([
	'ui.icon-set.main',
	'ui.hint',
	'ui.forms',
	'ui.system.typography',
	'ui.avatar',
	'socialnetwork.project-members-popup',
	'socialnetwork.v2.application.delete-project-popup',
]);

$component = $this->getComponent();
$isCompareMode = (($arParams['COMPARE_MODE'] ?? 'N') === 'Y');
$isTasksScope = (
	in_array($arParams['MODE'], [ WorkgroupList::MODE_TASKS_PROJECT, WorkgroupList::MODE_TASKS_SCRUM ], true)
	&& Loader::includeModule('tasks')
);

$settings = new Settings();
if (!$isTasksScope && !$settings->isToolAvailable(Settings::SONET_TOOLS['workgroups']))
{
	$componentParameters = [
		'LIMIT_CODE' => Settings::LIMIT_CODES['workgroups'],
		'MODULE' => 'socialnetwork',
		'SOURCE' => 'groupList',
	];

	$APPLICATION->IncludeComponent(
		"bitrix:ui.sidepanel.wrapper",
		"",
		[
			'POPUP_COMPONENT_NAME' => 'bitrix:intranet.settings.tool.stub',
			'POPUP_COMPONENT_TEMPLATE_NAME' => '',
			'POPUP_COMPONENT_PARAMS' => $componentParameters,
		],
	);

	return;
}

if ($isTasksScope && !$isCompareMode)
{
	$scope = (
	$arParams['MODE'] === WorkgroupList::MODE_TASKS_SCRUM
		? ScopeDictionary::SCOPE_SCRUM_PROJECTS_GRID
		: ScopeDictionary::SCOPE_PROJECTS_GRID
	);

	if ($scope === ScopeDictionary::SCOPE_SCRUM_PROJECTS_GRID)
	{
		$isAvailable = $settings->isToolAvailable(Settings::TASKS_TOOLS['scrum']);
		$limitCode = Settings::LIMIT_CODES['scrum'];
		$limitScope = Settings::TASKS_TOOLS['scrum'];
	}
	else
	{
		$isAvailable = $settings->isToolAvailable(Settings::TASKS_TOOLS['projects']);
		$limitCode = Settings::LIMIT_CODES['projects'];
		$limitScope = Settings::TASKS_TOOLS['projects'];
	}

	if (!$isAvailable)
	{
		$APPLICATION->IncludeComponent('bitrix:tasks.error', 'limit',
			[
				'SCOPE' => $limitScope,
				'LIMIT_CODE' => $limitCode,
			]
		);
		return;
	}

	$APPLICATION->IncludeComponent(
		'bitrix:tasks.interface.topmenu',
		'',
		[
			'USER_ID' => $arParams['USER_ID'],
			'SECTION_URL_PREFIX' => '',

			'MARK_SECTION_PROJECTS_LIST' => $arParams['MARK_SECTION_PROJECTS_LIST'] ?? '',
			'MARK_SECTION_SCRUM_LIST' => $arParams['MARK_SECTION_SCRUM_LIST'] ?? '',
			'USE_AJAX_ROLE_FILTER' => 'N',

			'PATH_TO_GROUP_TASKS' => $arParams['PATH_TO_GROUP_TASKS'] ?? '',
			'PATH_TO_GROUP_TASKS_TASK' => $arParams['PATH_TO_GROUP_TASKS_TASK'] ?? '',
			'PATH_TO_GROUP_TASKS_VIEW' => $arParams['PATH_TO_GROUP_TASKS_VIEW'] ?? '',
			'PATH_TO_GROUP_TASKS_REPORT' => $arParams['PATH_TO_GROUP_TASKS_REPORT'] ?? '',

			'PATH_TO_USER_TASKS' => $arParams['PATH_TO_USER_TASKS'] ?? '',
			'PATH_TO_USER_TASKS_TASK' => $arParams['PATH_TO_USER_TASKS_TASK'] ?? '',
			'PATH_TO_USER_TASKS_VIEW' => $arParams['PATH_TO_USER_TASKS_VIEW'] ?? '',
			'PATH_TO_USER_TASKS_REPORT' => $arParams['PATH_TO_USER_TASKS_REPORT'] ?? '',
			'PATH_TO_USER_TASKS_TEMPLATES' => $arParams['PATH_TO_USER_TASKS_TEMPLATES'] ?? '',

			'SCOPE' => $scope,
		],
		$component,
		[ 'HIDE_ICONS' => true ]
	);

	if (!empty($arResult['TASKS_COUNTERS']))
	{
		$APPLICATION->IncludeComponent(
			'bitrix:tasks.interface.toolbar',
			'',
			[
				'USER_ID' => (int)$arParams['USER_ID'],
				'GRID_ID' => $arResult['GRID_ID'],
				'FILTER_ID' => $arResult['FILTER_ID'],
				'COUNTERS' => $arResult['TASKS_COUNTERS'],
				'SCOPE' => $arResult['TASKS_COUNTERS_SCOPE'],
				'FILTER_FIELD' => 'COUNTERS',
			],
			$component,
			['HIDE_ICONS' => true]
		);
	}
}

//todo add here counter component for new sonet counters

$grid = $arResult['GRID'];
$templateMessages = Loc::loadLanguageFile(__FILE__);
?>

<style>
	.sonet-ui-grid-row-pinned td:not([style*="background-color"]){background-color:whitesmoke!important}
	@keyframes sonetProjectListRowHighlight {
		0% { background-color: #fff3b2; }
		100% { background-color: transparent; }
	}
	.sonet-ui-grid-row-highlighted td:not([style*="background-color"]) {
		animation: sonetProjectListRowHighlight 900ms ease;
	}
</style>
<div class="socialnetwork-project-list-wrapper">
	<?php
	$APPLICATION->IncludeComponent(
		'bitrix:main.ui.grid',
		'',
		$grid,
	);
	?>
</div>

<script>
	BX.ready(() => {
		BX.Loc.setMessage(<?= Json::encode($templateMessages) ?>);
		BX.UI.Hint.init(BX('main-grid-table'));
		BX.Socialnetwork.Project.List.Controller.init('<?= htmlspecialcharsbx($grid['GRID_ID']) ?>', {
			actionPrefix: '<?= \CUtil::JSEscape($arResult['ACTION_PREFIX'] ?? 'socialnetwork.v2.LegacyGroup') ?>',
			entityParam: '<?= \CUtil::JSEscape($arResult['ENTITY_PARAM'] ?? 'legacyGroupId') ?>',
			componentName: '<?= \CUtil::JSEscape($component->getName()) ?>',
			signedParameters: '<?= \CUtil::JSEscape($component->getSignedParameters()) ?>',
			taskRealtimeActions: <?= Json::encode($arResult['TASK_REALTIME_ACTIONS'] ?? []) ?>,
			pinMode: '<?= \CUtil::JSEscape($arResult['PIN_MODE'] ?? '') ?>',
			taskRealtimeStrategy: '<?= \CUtil::JSEscape($arResult['TASK_REALTIME_STRATEGY'] ?? '') ?>',
			usesTasksPull: <?= ($arResult['USES_TASKS_PULL'] ?? false) ? 'true' : 'false' ?>,
			realtimeCapabilities: <?= Json::encode($arResult['REALTIME_CAPABILITIES'] ?? []) ?>,
			filterId: '<?= \CUtil::JSEscape($arResult['FILTER_ID'] ?? '') ?>',
			signedPageContext: '<?= \CUtil::JSEscape($arResult['SIGNED_PAGE_CONTEXT'] ?? '') ?>',
			realtimeUiContext: <?= Json::encode($arResult['REALTIME_UI_CONTEXT'] ?? []) ?>,
		});
	});
</script>
<?php
$tours = $arResult['TOURS'] ?? [];
if (!empty($tours) && Loader::includeModule('tasks'))
{
	Extension::load(['tasks.tour']);
	?>
	<script>
		BX.ready(() => {
			const tour = new BX.Tasks.Tour.Tour({
				tours: <?= Json::encode($tours) ?>,
			});
		});
	</script>
	<?php
}
?>
