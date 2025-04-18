<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Main\Loader;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\Page\Asset;
use Bitrix\Main\Text\HtmlFilter;
use Bitrix\Main\UI\Extension;
use Bitrix\Main\Web\Json;
use Bitrix\Tasks\Internals\Task\Status;

/** @var array $arResult */
/** @global CMain $APPLICATION */
/** @var CBitrixComponent $component */
/** @var CBitrixComponentTemplate $this */

Asset::getInstance()->addJs(SITE_TEMPLATE_PATH . '/log_mobile.js');
Asset::getInstance()->addCss($this->GetFolder() . '/style.css');

Extension::load([
	'mobile.diskfile',
	'tasks.result',
	'ui.alerts',
]);

$taskId = (int)$arResult['TASK_ID'];
?>

<script>
	BX.ready(
		function()
		{
			BXMobileApp.addCustomEvent('tasks-view-new:onTaskForbidden', (event) => {
				if (Number(event.taskId) === <?= $taskId ?>)
				{
					app.closeController({ drop: true });
				}
			});
			BXMobileApp.Events.postToComponent('tasks.task.comments:onComponentReady', []);
		}
	);
</script>

<?php
if (is_array($arResult['ERRORS']) && !empty($arResult['ERRORS']))
{
	$isUiIncluded = Loader::includeModule('ui');
	foreach ($arResult['ERRORS'] as $error)
	{
		$message = $error['MESSAGE'];
		if ($isUiIncluded)
		{
			?>
			<div class="ui-alert ui-alert-danger">
				<span class="ui-alert-message"><?= htmlspecialcharsbx($message) ?></span>
			</div>
			<?php
		}
		else
		{
			ShowError($message);
		}
	}

	return;
}
?>

<div style="display: none">
	<?php
	$votingIncludeStart = microtime(true);
	$APPLICATION->IncludeComponent(
		'bitrix:rating.vote',
		'like_react',
		[
			'MOBILE' => 'Y',
			'ENTITY_TYPE_ID' => 'TASK',
			'ENTITY_ID' => $taskId,
			'OWNER_ID' => $arResult['TASK']['CREATED_BY'],
			'VOTE_ID' => HtmlFilter::encode("TASK_{$taskId}-" . (time() + random_int(0, 1000))),
			'TYPE' => 'POST',
		],
		$component->__parent,
		['HIDE_ICONS' => 'Y']
	);
	$votingIncludeEnd = microtime(true);
	?>
</div>

<div id="task-comments-block">
	<?php
	$analytics = [
		'data-analytics' => [
			'c_section' => 'comment',
			'c_element' => 'title_click',
		],
	];

	$commentsIncludeStart = microtime(true);
	$APPLICATION->IncludeComponent(
		'bitrix:forum.comments',
		'',
		[
			'FORUM_ID' => $arResult['FORUM_ID'],
			'ENTITY_TYPE' => 'TK',
			'ENTITY_ID' => $taskId,
			'ENTITY_XML_ID' => "TASK_{$taskId}",
			'POST_CONTENT_TYPE_ID' => 'TASK',
			'URL_TEMPLATES_PROFILE_VIEW' => $arResult['PATH_TEMPLATE_TO_USER_PROFILE'],
			'CACHE_TYPE' => 'Y',
			'CACHE_TIME' => 3600,
			'IMAGE_HTML_SIZE' => 400,
			'DATE_TIME_FORMAT' => $arResult['DATE_TIME_FORMAT'],
			'SHOW_RATING' => 'Y',
			'RATING_TYPE' => 'like',
			'PREORDER' => 'N',
			'PERMISSION' => 'M',
			'NAME_TEMPLATE' => $arResult['NAME_TEMPLATE'],
			'SKIP_USER_READ' => 'Y',
			'ATTRIBUTES' => [
				'ANCHOR' => $analytics,
				'TEXT_ANCHOR' => $analytics,
				'ANALYTICS_DATA' => $arResult['ANALYTICS_LABEL'],
			],
		],
		null,
		['HIDE_ICONS' => 'Y']
	);
	$commentsIncludeEnd = microtime(true);

	$arResult['DEBUG']['votingInclude'] = $votingIncludeEnd - $votingIncludeStart;
	$arResult['DEBUG']['commentsInclude'] = $commentsIncludeEnd - $commentsIncludeStart;
	$arResult['DEBUG']['executeComponent'] = microtime(true) - $arResult['DEBUG']['executeComponentStart'];
	unset($arResult['DEBUG']['executeComponentStart']);
	?>
</div>

<div class="task-detail-no-comments --full-height" id="commentsStub">
	<div class="task-detail-no-comments-inner">
		<div class="task-detail-no-comments-top-image-container">
			<div class="task-detail-no-comments-top-image"></div>
		</div>
		<div class="task-detail-no-comments-text">
			<?= Loc::getMessage('TASKSMOBILE_COMMENTS_STUB_TEXT') ?>
		</div>
		<div class="task-detail-no-comments-arrow-container">
			<div class="task-detail-no-comments-arrow"></div>
		</div>
	</div>
</div>
<div id="debug" style="font-size: 10px">
	<?php
	$optionGetStart = microtime(true);
	$isDebugEnabled = \Bitrix\Main\Config\Option::get('tasksmobile', 'comments_debug_enabled', 'N') === 'Y';
	$arResult['DEBUG']['optionGet'] = microtime(true) - $optionGetStart;

	if ($isDebugEnabled)
	{
		foreach ($arResult['DEBUG'] as $key => $value)
		{
			?><div><?= htmlspecialcharsbx($key) ?>: <?= round($value, 4) ?></div><?php
		}
	}
	?>
</div>

<script>
	BX.ready(
		function()
		{
			new BX.TasksMobile.Comments(<?= Json::encode([
				'userId' => $arResult['USER_ID'],
				'taskId' => $taskId,
				'guid' => $arResult['GUID'],
				'logId' => $arResult['LOG_ID'],
				'currentTs' => time(),
				'resultComments' => $arResult['RESULT_COMMENTS'],
				'isClosed' => in_array(
					(int)$arResult['TASK']['STATUS'],
					[Status::SUPPOSEDLY_COMPLETED, Status::COMPLETED],
					true
				),
			]) ?>);
		}
	);

	const classList = document.documentElement.classList;
	classList.forEach((className) => {
		if (className === 'light' || className === 'dark')
		{
			classList.remove(className);
			classList.add(`new${className}`);
		}
	});
</script>
