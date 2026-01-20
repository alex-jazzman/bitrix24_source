<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Bizproc\Activity\ActivityDescription;
use Bitrix\Bizproc\Activity\Enum\ActivityType;
use Bitrix\Main\Localization\Loc;

$arActivityDescription = (
	new ActivityDescription(
		name: Loc::getMessage('TASKS_DTA_NAME_1'),
		description: Loc::getMessage('TASKS_DTA_DESC_1'),
		type: [ ActivityType::ACTIVITY->value, ActivityType::ROBOT->value, ActivityType::NODE_ACTION->value ],
	)
)
	->setClass('TasksDeleteTaskActivity')
	->setJsClass(ActivityDescription::DEFAULT_ACTIVITY_JS_CLASS)
	->setCategory([
		'ID' => 'document',
		'OWN_ID' => 'tasks',
		'OWN_NAME' => Loc::getMessage('TASKS_DTA_CATEGORY'),
	])
	->setFilter([
		'INCLUDE' => [
			['tasks'],
		],
	])
	->setRobotSettings([
		'CATEGORY' => 'employee',
		'GROUP' => ['taskManagement'],
	])
	->setNodeActionSettings([
		'INCLUDE' => ['taskscomplexactivity'],
		'HANDLES_DOCUMENT' => true,
	])
	->toArray()
;
