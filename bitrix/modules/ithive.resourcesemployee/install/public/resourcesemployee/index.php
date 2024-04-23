<?

use Bitrix\Main\Config\Option;

require($_SERVER['DOCUMENT_ROOT'] . '/bitrix/header.php');?>

<?php $APPLICATION->IncludeComponent(
	'ithive:resourcesemployee.task.gantt',
	'',
	[
		'SET_NAV_CHAIN' => 'Y',
		'SET_TITLE' => 'Y',
		'DATE_TIME_FORMAT' => 'd.m.Y H:i:s',
		'PATH_TO_USER_TASKS' => '/company/personal/user/#user_id#/tasks/',
		'PATH_TO_USER_TASKS_TASK' => '/company/personal/user/#user_id#/tasks/task/#action#/#task_id#/',
		'USE_EXPORT'=>'N',
	]
);
?>
<? require($_SERVER['DOCUMENT_ROOT'] . '/bitrix/footer.php'); ?>