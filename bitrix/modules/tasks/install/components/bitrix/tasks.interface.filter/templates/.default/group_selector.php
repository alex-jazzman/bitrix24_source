<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\UI\Buttons;

$containerID = 'tasks_group_selector';
if (isset($arResult['GROUPS'][$arParams['GROUP_ID']]))
{
	$currentGroup = $arResult['GROUPS'][$arParams['GROUP_ID']];
	unset($arResult['GROUPS'][$arParams['GROUP_ID']]);
}
else
{
	$currentGroup = array(
		'id'   => 'wo',
		'text' => \GetMessage('TASKS_BTN_GROUP_WO')
	);
}

\Bitrix\Main\UI\Extension::load(['ui.buttons']);

$groupBtn = new Buttons\Button([
	'text' => $currentGroup['text'],
	'color' => Buttons\Color::LIGHT_BORDER,
	'round' => true,
	'noCaps' => true,
	'dropdown' => true,
]);
$groupBtn->addAttribute('id', $containerID);
$groupBtn->addAttribute('data-testid', 'tasks-filter-group-btn');
$groupBtn->addAttribute('aria-label', \GetMessage('TASKS_FILTER_GROUP_BTN_ARIA_LABEL', ['#NAME#' => $currentGroup['text']]));
$groupBtn->addAttribute('aria-haspopup', 'menu');
$groupBtn->addAttribute('aria-expanded', 'false');
?>

<div class="pagetitle-container pagetitle-flexible-space">
	<div class="tasks-interface-toolbar-button-container">
		<?= $groupBtn->render() ?>
	</div>
</div>

<script>
	BX.ready(
		function()
		{
			BX.TasksGroupsSelectorInit({
				groupId: <?= intval($arParams['GROUP_ID'])?>,
				selectorId: "<?= \CUtil::JSEscape($containerID)?>",
				buttonAddId: "tasks-buttonAdd",
				pathTaskAdd: "<?= \CUtil::JSEscape(\CComponentEngine::makePathFromTemplate(
					$arParams['MENU_GROUP_ID'] > 0
						? $arParams['PATH_TO_GROUP_TASKS_TASK']
						: $arParams['PATH_TO_USER_TASKS_TASK'],
					array(
						'action'   => 'edit',
						'task_id'  => 0,
						'user_id'  => $arResult['USER_ID'],
						'group_id' => $arParams['MENU_GROUP_ID']
					)
				))?>",
				groups: <?= \CUtil::PhpToJSObject(array_values($arResult['GROUPS']))?>,
				currentGroup: <?= \CUtil::PhpToJSObject($currentGroup)?>,
				groupLimit: <?= intval($arParams['GROUP_SELECTOR_LIMIT'])?>,
				messages: {
					TASKS_BTN_GROUP_WO: "<?= \GetMessageJS('TASKS_BTN_GROUP_WO')?>",
					TASKS_BTN_GROUP_SELECT: "<?= \GetMessageJS('TASKS_BTN_GROUP_SELECT')?>",
					TASKS_FILTER_GROUP_BTN_ARIA_LABEL: "<?= \GetMessageJS('TASKS_FILTER_GROUP_BTN_ARIA_LABEL')?>"
				},
				offsetLeft: <?= $arParams['PROJECT_VIEW'] === 'Y' ? 19 : 0 ?>
			});
		}
	);
</script>