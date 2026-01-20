<?php

use Bitrix\Main\Context;
use Bitrix\Main\Loader;
use Bitrix\Main\UI\Extension;
use Bitrix\Tasks\Slider\Path\TaskPathMaker;
use Bitrix\Tasks\V2\FormV2Feature;

/** @var $hasAccess */
/** @var CUser $USER */
/** @var CMain $APPLICATION */

require $_SERVER['DOCUMENT_ROOT'] . '/bitrix/header.php';

require 'page_include.php';

if (!$hasAccess)
{
	$arReturn = ['ERROR_CODE' => !$USER->isAuthorized() ? 'NO_AUTH' : 'NO_RIGHTS'];

	require $_SERVER['DOCUMENT_ROOT'] . '/bitrix/footer.php';
}

$taskId = (int)Context::getCurrent()->getRequest()->get('task_id');
if ($taskId <= 0)
{
	$arReturn = ['ERROR_CODE' => 'NO_RIGHTS'];

	require $_SERVER['DOCUMENT_ROOT'] . '/bitrix/footer.php';
}

$userId = (int)$USER->getId();

$formFeatureEnabled = Loader::includeModule('tasks') && FormV2Feature::isOn();

if ($formFeatureEnabled)
{
	Extension::load([
		'tasks.v2.application.task-card',
		'main.core',
		'sidepanel',
	]);

	$pathMaker = new TaskPathMaker($taskId, $userId);

	$pathToList = $pathMaker->makeEntitiesListPath();
	$pathToTask = $pathMaker->makeEntityPath();
	?>
	<script>
		top.BX.ready(async function() {
			const { TaskCard } = await top.BX.Runtime.loadExtension('tasks.v2.application.task-card');

			TaskCard.showFullCard({
				taskId: <?= $taskId ?>,
				closeCompleteUrl: "<?= $pathToList ?>",
				url: "<?= $pathToTask ?>",
			});
		});
	</script>
	<?php

	require $_SERVER['DOCUMENT_ROOT'] . '/bitrix/footer.php';
}

$isOldFormEnabled = Context::getCurrent()->getRequest()->get('OLD_FORM') === 'Y'
	&& Loader::includeModule('tasks')
	&& FormV2Feature::isOn('old_form');

if ($isOldFormEnabled || !FormV2Feature::isOn())
{
	$APPLICATION->IncludeComponent(
		'bitrix:tasks.iframe.popup',
		'public',
		[],
		null,
		['HIDE_ICONS' => 'Y']
	);

	require $_SERVER['DOCUMENT_ROOT'] . '/bitrix/footer.php';
}
