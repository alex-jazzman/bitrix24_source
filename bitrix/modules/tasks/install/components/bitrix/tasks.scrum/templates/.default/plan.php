<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

/** @var $APPLICATION \CMain */
/** @var array $arResult */
/** @var array $arParams */
/** @var \CBitrixComponent $component */
/** @var array $messages */
/** @var string $filterId */
/** @var Filter $filterInstance */

use Bitrix\Main\Web\Json;
use Bitrix\Tasks\Helper\Filter;
use Bitrix\Tasks\Update\TagConverter;
use Bitrix\Main\UI\Extension;

Extension::load(['ui.actions-bar']);

if ($arParams['CONTEXT'] === 'group')
{
	require_once __DIR__.'/header.php';
}
else
{
	require_once __DIR__.'/external_header.php';
}

$pathToTask = str_replace('#action#', 'view', $arParams['PATH_TO_GROUP_TASKS_TASK']);
$pathToTask = str_replace('#group_id#', $arParams['GROUP_ID'], $pathToTask);

$pathToTaskCreate = str_replace('#action#', 'edit', $arParams['PATH_TO_GROUP_TASKS_TASK']);
$pathToTaskCreate = str_replace('#group_id#', $arParams['GROUP_ID'], $pathToTaskCreate);

$pathToBurnDown = str_replace('#group_id#', $arParams['GROUP_ID'], $arParams['PATH_TO_SCRUM_BURN_DOWN']);

//Checking for working tags agent
$tagsAreConverting = TagConverter::isProceed();
?>

<div id="tasks-scrum-container" class="tasks-scrum__container tasks-scrum__scope"></div>

<script>
	BX.ready(function()
	{
		const blockRenderNav = document.getElementById('tasks-scrum-switcher');

		BX.message(<?= Json::encode($messages) ?>);
		BX.Tasks.Scrum.Entry = new BX.Tasks.Scrum.Entry({
			tagsAreConverting: '<?=$tagsAreConverting?>',
			viewName: 'plan',
			signedParameters: '<?= $this->getComponent()->getSignedParameters() ?>',
			debugMode: '<?= $arResult['debugMode'] ?>',
			isOwnerCurrentUser: '<?= ($arResult['isOwnerCurrentUser'] ? 'Y' : 'N') ?>',
			userId: '<?= (int) $arParams['USER_ID'] ?>',
			groupId: '<?= (int) $arParams['GROUP_ID'] ?>',
			defaultSprintDuration: '<?=(int) $arResult['defaultSprintDuration'] ?>',
			pageNumberToCompletedSprints: '1',
			pathToTask: '<?= \CUtil::jSEscape($pathToTask) ?>',
			pathToTaskCreate: '<?= \CUtil::JSEscape($pathToTaskCreate)?>',
			pathToBurnDown: '<?= \CUtil::JSEscape($pathToBurnDown)?>',
			mandatoryExists: '<?= $arResult['mandatoryExists'] ?>',
			backlog: <?= Json::encode($arResult['backlog']) ?>,
			sprints: <?= Json::encode($arResult['sprints']) ?>,
			views: <?= Json::encode($arResult['views']) ?>,
			culture: <?= Json::encode($arResult['culture']) ?>,
			activeSprintId: '<?= $arResult['activeSprintId'] ?>',
			filterId: '<?= $filterId ?>',
			defaultResponsible: <?= Json::encode($arResult['defaultResponsible']) ?>,
			pageSize: <?= $arResult['pageSize'] ?>,
			isShortView: '<?= $arResult['isShortView'] ?>',
			isExactSearchApplied: '<?= $arResult['isExactSearchApplied'] ?>',
			displayPriority: '<?= $arResult['displayPriority'] ?>',
			target: blockRenderNav,
		});

		<?php if ($arParams['CONTEXT'] === 'group'): ?>
			BX.Tasks.Scrum.Entry.renderTabsTo(blockRenderNav);
			BX.Tasks.Scrum.Entry.renderRightElementsTo(document.getElementById('tasks-scrum-right-container'));
		<?php endif; ?>

		BX.Tasks.Scrum.Entry.renderTo(document.getElementById('tasks-scrum-container'));
	});

	(new BX.UI.ActionsBar.RightButtons({
		buttonsContainer: document.getElementById('tasks-scrum-right-container'),
		collapsable: false,
	})).init();
</script>
