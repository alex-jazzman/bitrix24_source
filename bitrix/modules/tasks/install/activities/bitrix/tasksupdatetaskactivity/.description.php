<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Bizproc\Activity\ActivityDescription;
use Bitrix\Bizproc\Activity\Enum\ActionArea;
use Bitrix\Bizproc\Activity\Enum\ActionGroup;
use Bitrix\Bizproc\Activity\Enum\ActivityType;
use Bitrix\Main\Localization\Loc;

$description = (
	new ActivityDescription(
		name: Loc::getMessage('TASKS_UTA_NAME_1'),
		description: Loc::getMessage('TASKS_UTA_DESC_1'),
		type: [ ActivityType::ACTIVITY->value, ActivityType::ROBOT->value, ActivityType::NODE_ACTION->value ],
	)
)
	->setClass('TasksUpdateTaskActivity')
	->setJsClass(ActivityDescription::DEFAULT_ACTIVITY_JS_CLASS)
	->setCategory([
		'ID' => 'document',
		'OWN_ID' => 'tasks',
		'OWN_NAME' => Loc::getMessage('TASKS_UTA_CATEGORY'),
	])
	->setReturn([
		'ErrorMessage' => [
			'NAME' => Loc::getMessage('TASKS_UTA_ERROR_MESSAGE'),
			'TYPE' => 'string',
		],
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
;

if (
	enum_exists('\Bitrix\Bizproc\Activity\Enum\ActionGroup')
	&& enum_exists('\Bitrix\Bizproc\Activity\Enum\ActionArea')
)
{
	$description->setNodeActionSettings([
		'HANDLES_DOCUMENT' => true,
		'ACTION_GROUP' => ActionGroup::UPDATE->value,
		'ACTION_AREA' => ActionArea::TASKS->value,
		'ACTION_OBJECTS' => [
			['id' => 'task', 'title' => Loc::getMessage('TASKS_ACTIVITY_OBJECT_TASK')],
		],
	]);
}

$arActivityDescription = $description->toArray();
