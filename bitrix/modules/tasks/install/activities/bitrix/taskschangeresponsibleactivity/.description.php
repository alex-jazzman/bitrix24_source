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
		name: Loc::getMessage('TASKS_CHANGE_RESPONSIBLE_NAME_1_V2'),
		description: Loc::getMessage('TASKS_CHANGE_RESPONSIBLE_DESC_1_MSGVER_1'),
		type: [ ActivityType::ACTIVITY->value, ActivityType::ROBOT->value, ActivityType::NODE_ACTION->value ],
	)
)
	->setClass('TasksChangeResponsibleActivity')
	->setJsClass(ActivityDescription::DEFAULT_ACTIVITY_JS_CLASS)
	->setCategory([
		'ID' => 'document',
		'OWN_ID' => 'tasks',
		'OWN_NAME' => Loc::getMessage('TASKS_CHANGE_RESPONSIBLE_CATEGORY'),
	])
	->setFilter([
		'INCLUDE' => [
			['tasks'],
		],
	])
	->setRobotSettings([
		'CATEGORY' => 'employee',
		'RESPONSIBLE_PROPERTY' => 'Responsible',
		'GROUP' => ['elementControl'],
	])
	->setNodeActionSettings([
		'INCLUDE' => ['taskscomplexactivity'],
		'HANDLES_DOCUMENT' => true,
	])
	->toArray()
;
