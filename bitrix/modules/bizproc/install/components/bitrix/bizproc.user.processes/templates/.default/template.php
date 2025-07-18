<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Main\Loader;
?>
<div id="bp-user-processes-errors-container"></div>
<?php

/**
 * @var array $arResult
 * @var CBitrixComponentTemplate $this
 */

\Bitrix\Main\UI\Extension::load([
	'main.polyfill.intersectionobserver',
	'bizproc.router',
	'bizproc.task',
	'bizproc.workflow.timeline',
	'bizproc.workflow.faces',
	'bizproc.workflow.faces.summary',
	'bizproc.workflow.result',
	'pull.client',
	'sidepanel',
	'tooltip',
	'ui',
	'ui.alerts',
	'ui.buttons',
	'ui.buttons.icons',
	'ui.cnt',
	'ui.entity-selector',
	'ui.fonts.opensans',
	'ui.icons',
	'ui.icon-set.main',
	'ui.viewer',
	'ui.counterpanel',
	'ui.hint',
	'ui.lottie',
	'ui.qrauthorization',
	'main.qrcode',
	'ui.mobile-promoter'
]);
\Bitrix\Main\Page\Asset::getInstance()->addJs('/bitrix/js/bizproc/tools.js');

if (IsModuleInstalled('crm'))
{
	CJSCore::Init('sidepanel');
	\Bitrix\Main\Page\Asset::getInstance()->addJs('/bitrix/js/crm/common.js');
}

$viewData = is_array($arResult['viewData'] ?? null) ? $arResult['viewData'] : [];
$workflows = $viewData['workflows'] ?? [];
$currentUserId = $viewData['userId'] ?? 0;
$targetUserId = $viewData['targetUserId'] ?? $currentUserId;
$component = $this->getComponent();
$mobilePopupOption = CUserOptions::GetOption('bizproc.user.processes', 'mobile_promotion_popup');

$appLink =
	Loader::includeModule('mobile')
		? \Bitrix\Mobile\Deeplink::getAuthLink('bizproc', $currentUserId)
		: ''
;

$wrapJsRender = static function (array $workflow, string $columnId, string $placeholder = ''): string
{
	return sprintf(
		'<div data-role="bp-render-cell" data-column="%s" data-workflow="%s">%s</div>',
		htmlspecialcharsbx($columnId),
		htmlspecialcharsbx(\Bitrix\Main\Web\Json::encode($workflow)),
		htmlspecialcharsbx($placeholder),
	);
};

$getRowActions = function (array $document, ?array $task, string $workflowId): array
{
	$actions = [
		[
			'text' => \Bitrix\Main\Localization\Loc::getMessage('BIZPROC_USER_PROCESSES_TEMPLATE_ROW_ACTION_DOCUMENT'),
			'href' => $document['url'] ?? '#',
		],
	];

	if (is_array($task))
	{
		$actions[] = [
			'text' => \Bitrix\Main\Localization\Loc::getMessage('BIZPROC_USER_PROCESSES_TEMPLATE_ROW_ACTION_TASK'),
			'href' => $task['url'],
		];
	}

	return $actions;
};

$getRowCounter = function (array $workflow, int $currentUserId, int $targetUserId): array
{
	if ($currentUserId === $targetUserId && ($workflow['taskCnt'] > 0 || $workflow['commentCnt'] > 0))
	{
		$primaryColor =
			$workflow['taskCnt'] === 0 && $workflow['commentCnt'] > 0
				? \Bitrix\Main\Grid\Counter\Color::SUCCESS
				: \Bitrix\Main\Grid\Counter\Color::DANGER
		;

		return [
			'MODIFIED' => [
				'type' => \Bitrix\Main\Grid\Counter\Type::LEFT,
				'value' => $workflow['taskCnt'] + $workflow['commentCnt'],
				'color' => $primaryColor,
				'secondaryColor' => \Bitrix\Main\Grid\Counter\Color::SUCCESS,
				'isDouble' => $workflow['taskCnt'] > 0 && $workflow['commentCnt'] > 0,
			],
		];
	}


	return [];
};

$gridRows = [];

foreach ($workflows as $row)
{
	$workflowId = $row['workflowId'] ?? '';
	$document = $row['document'] ?? [];
	$taskToShow = $row['task'] ?? null;

	$gridRows[] = [
		'id' => $workflowId,
		'columns' => [
			'ID' => $workflowId,
			'PROCESS' => $wrapJsRender($row, 'PROCESS', $row['name'] ?? ''),
			'TASK_PROGRESS' =>  $wrapJsRender($row, 'TASK_PROGRESS'),
			'TASK' => $wrapJsRender($row, 'TASK'),
			'WORKFLOW_STATE' => htmlspecialcharsbx($row['statusText'] ?? ''),
			'DOCUMENT_NAME' => $wrapJsRender($row, 'DOCUMENT_NAME', $row['document']['name'] ?? ''),
			'WORKFLOW_TEMPLATE_NAME' => htmlspecialcharsbx($row['templateName'] ?? ''),
			'TASK_DESCRIPTION' => $row['description'] ?? '',
			'MODIFIED' => htmlspecialcharsbx($row['modified'] ?? ''),
			'WORKFLOW_STARTED' => htmlspecialcharsbx($row['workflowStarted'] ?? ''),
			'WORKFLOW_STARTED_BY' => htmlspecialcharsbx($row['startedBy'] ?? ''),
			'OVERDUE_DATE' => htmlspecialcharsbx($row['overdueDate'] ?? ''),
			'SUMMARY' => $wrapJsRender($row, 'SUMMARY'),
		],
		'actions' => $getRowActions($row['document'] ?? [], $taskToShow, $workflowId),
		'columnClasses' => [
			'TASK_PROGRESS' => 'bp-task-progress-cell',
			'SUMMARY' => 'bp-summary-cell',
			'TASK' => $row['isCompleted'] ? 'bp-status-completed-cell' : '',
			'TASK_DESCRIPTION' => 'bp-description-cell',
		],
		'editable' => !empty($row['task']),
		'counters' => $getRowCounter($row, $currentUserId, $targetUserId),
	];
}

/** @var array $arResult */
global $APPLICATION;
/** @var \Bitrix\Main\UI\PageNavigation $pageNavigation */
$pageNavigation = $arResult['pageNavigation'];

$APPLICATION->IncludeComponent(
	'bitrix:main.ui.grid',
	'',
	[
		'GRID_ID' => $arResult['gridId'],
		'COLUMNS' => $arResult['gridColumns'],
		'ROWS' => $gridRows,
		'SHOW_ROW_CHECKBOXES' => true,
		'NAV_OBJECT' => $arResult['pageNavigation'],
		'AJAX_MODE' => 'Y',
		'AJAX_ID' => CAjax::getComponentID('bitrix:bizproc.user.processes', '.default', ''),
		'PAGE_SIZES' => $arResult['pageSizes'],
		'AJAX_OPTION_JUMP' => 'N',
		'SHOW_ROW_ACTIONS_MENU' => true,
		'SHOW_GRID_SETTINGS_MENU' => true,
		'SHOW_NAVIGATION_PANEL' => true,
		'SHOW_PAGINATION' => true,
		'SHOW_MORE_BUTTON' => true,
		'ENABLE_NEXT_PAGE' => $pageNavigation->getCurrentPage() < $pageNavigation->getPageCount(),
		'CURRENT_PAGE' => $pageNavigation->getCurrentPage(),
		'NAV_PARAM_NAME' => $arResult['navigationId'],
		'SHOW_SELECTED_COUNTER' => false,
		'SHOW_TOTAL_COUNTER' => true,
		'TOTAL_ROWS_COUNT' => $arResult['pageNavigation']->getRecordCount(),
		'SHOW_PAGESIZE' => true,
		'SHOW_ACTION_PANEL' => true,
		'ACTION_PANEL' => $arResult['gridActions'] ?? null,
		'ALLOW_COLUMNS_SORT' => true,
		'ALLOW_COLUMNS_RESIZE' => true,
		'ALLOW_HORIZONTAL_SCROLL' => true,
		'ALLOW_INLINE_EDIT' => true,
		'ALLOW_SORT' => true,
		'ALLOW_PIN_HEADER' => true,
		'AJAX_OPTION_HISTORY' => 'N',
		'HANDLE_RESPONSE_ERROR' => true,
		'MESSAGES' => array_map(
			fn ($error) => [
				'TEXT' => $error->getMessage(),
				'TYPE' => 'error',
			],
			$this->getComponent()->getErrors(),
		),
	],
);

$messages = \Bitrix\Main\Localization\Loc::loadLanguageFile(__FILE__);
?>
<script>
	BX.ready(function ()
	{
		BX.Bizproc.Router.init();
		BX.message(<?= \Bitrix\Main\Web\Json::encode($messages) ?>);

		const gridId = '<?= CUtil::JSEscape($arResult['gridId']) ?>';
		const filterId = '<?= CUtil::JSEscape($arResult['filterId']) ?>';

		BX.Bizproc.Component.UserProcesses.Instance = new BX.Bizproc.Component.UserProcesses({
			gridId,
			filterId,
			counters: <?= \Bitrix\Main\Web\Json::encode($arResult['counters']) ?>,
			actionPanelUserWrapperId: '<?= CUtil::JSEscape($viewData['actionPanelUserWrapperId'] ?? null) ?>',
			errors: [],
			currentUserId: <?= (int)($viewData['userId'] ?? 0) ?>,
			targetUserId: <?= $targetUserId ?>,
			mustSubscribeToPushes: <?= ($arResult['mustSubscribeToPushes'] ?? false) ? 'true' : 'false' ?>,
			shownMobilePopup: <?= ($mobilePopupOption['shown_popup'] ?? false) ? 'true' : 'false' ?>,
			appLink: '<?= CUtil::JSEscape($appLink) ?>',
		});
		BX.addCustomEvent('Grid::updated', () => BX.Bizproc.Component.UserProcesses.Instance.init());

		setTimeout(() => {
			BX.Runtime.loadExtension('ui.analytics').then(({ sendData }) => {
				sendData({
					tool: 'automation',
					category: 'bizproc_operations',
					event: 'processes_open',
				});
			});
		}, 2000);

		<?php if (!empty($viewData['listParams'])): ?>
		BX.Bizproc.Component.UserProcesses.Instance.creationGuideOpen(
			<?= \Bitrix\Main\Web\Json::encode($viewData['listParams']) ?>,
		);
		<?php endif; ?>
	})
</script>

<?php
$this->setViewTarget("below_pagetitle", 100); ?>
	<div class="bp-user-processes-bizproc-counterpanel" data-role="bizproc-counterpanel">

	</div>
<?php $this->endViewTarget();
