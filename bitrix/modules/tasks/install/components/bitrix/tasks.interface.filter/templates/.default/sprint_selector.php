<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Main\Localization\Loc;
use Bitrix\UI\Buttons;
use Bitrix\UI\Toolbar\ButtonLocation;
use Bitrix\UI\Toolbar\Facade\Toolbar;

$containerID = 'tasks_sprint_selector';

$currentSprintName = $arResult['SPRINT']['START_TIME']
	. ' - ' . $arResult['SPRINT']['FINISH_TIME']
;

$tasksSprintSelector = new Buttons\Button([
	'color' => Buttons\Color::LIGHT_BORDER,
	'text' => $currentSprintName,
	'dropdown' => true,
]);

$tasksSprintSelector->addAttribute('id', $containerID);
$tasksSprintSelector->addAttribute('data-testid', 'tasks-filter-sprint-btn');
$tasksSprintSelector->addAttribute('aria-label', Loc::getMessage('TASKS_FILTER_SPRINT_BTN_ARIA_LABEL', ['#RANGE#' => $currentSprintName]));
$tasksSprintSelector->addAttribute('aria-haspopup', 'dialog');
$tasksSprintSelector->addAttribute('aria-expanded', 'false');

Toolbar::addButton($tasksSprintSelector, ButtonLocation::AFTER_FILTER);
?>

<script>
	BX.ready(function()
	{
		BX.Tasks.SprintSelector(
			'<?= $containerID;?>',
			{
				sprintId: <?= $arParams['SPRINT_ID'];?>,
				groupId: <?= $arParams['GROUP_ID'];?>,
				messages: {
					TASKS_FILTER_SPRINT_BTN_ARIA_LABEL: '<?= \GetMessageJS('TASKS_FILTER_SPRINT_BTN_ARIA_LABEL') ?>',
					TASKS_FILTER_SPRINT_DIALOG_ARIA_LABEL: '<?= \GetMessageJS('TASKS_FILTER_SPRINT_DIALOG_ARIA_LABEL') ?>'
				}
			}
		);
	});
</script>
