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

$description = (new ActivityDescription(
	name: Loc::getMessage('TASKS_ADD_RESULT_ACTIVITY_NAME'),
	description: Loc::getMessage('TASKS_ADD_RESULT_ACTIVITY_DESCRIPTION'),
	type: [ActivityType::NODE_ACTION->value],
))
	->setClass('TasksAddResultActivity')
	->setJsClass(ActivityDescription::DEFAULT_ACTIVITY_JS_CLASS)
	->setCategory([
		'ID' => 'document',
		'OWN_ID' => 'tasks',
		'OWN_NAME' => Loc::getMessage('TASKS_ADD_RESULT_ACTIVITY_CATEGORY'),
	])
	->setReturn([
		'ErrorMessage' => [
			'NAME' => Loc::getMessage('TASKS_ADD_RESULT_ACTIVITY_ERROR_MESSAGE'),
			'TYPE' => 'string',
		],
	])
	->setFilter([
		'INCLUDE' => [
			['tasks'],
		],
	])
;

if (
	enum_exists('\Bitrix\Bizproc\Activity\Enum\ActionGroup')
	&& enum_exists('\Bitrix\Bizproc\Activity\Enum\ActionArea')
)
{
	$description->setNodeActionSettings([
		'HANDLES_DOCUMENT' => true,
		'ACTION_GROUP' => ActionGroup::ADD->value,
		'ACTION_AREA' => ActionArea::TASKS->value,
		'ACTION_OBJECTS' => [
			['id' => 'task', 'title' => Loc::getMessage('TASKS_ACTIVITY_OBJECT_TASK')],
		],
	]);
}

$arActivityDescription = $description->toArray();
