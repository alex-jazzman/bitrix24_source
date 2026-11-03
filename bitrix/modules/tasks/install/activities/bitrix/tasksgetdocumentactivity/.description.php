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
use Bitrix\Bizproc\FieldType;
use Bitrix\Tasks\Integration\Bizproc\Document\Task;

$arActivityDescription = (
	new ActivityDescription(
		name: Loc::getMessage('TASKS_GLDA_NAME_1'),
		description: Loc::getMessage('TASKS_GLDA_DESC_1_MSGVER_1'),
		type: [
			ActivityType::ACTIVITY->value,
			ActivityType::ROBOT->value,
			ActivityType::NODE_ACTION->value,
		]
	)
)
	->setClass('TasksGetDocumentActivity')
	->setJsClass(ActivityDescription::DEFAULT_ACTIVITY_JS_CLASS)
	->setCategory([
		'ID' => 'document',
	])
	->setAdditionalResult(['FieldsMap'])
	->setRobotSettings([
		'CATEGORY' => 'employee',
		'GROUP' => ['taskManagement'],
		'SORT' => 2200,
		'IS_SUPPORTING_ROBOT' => true,
	])
;

if (
	enum_exists('\Bitrix\Bizproc\Activity\Enum\ActionGroup')
	&& enum_exists('\Bitrix\Bizproc\Activity\Enum\ActionArea')
)
{
	$arActivityDescription->setNodeActionSettings([
		'HANDLES_DOCUMENT' => false,
		'ACTION_GROUP' => ActionGroup::GET->value,
		'ACTION_AREA' => ActionArea::TASKS->value,
		'ACTION_OBJECTS' => [
			['id' => 'task', 'title' => Loc::getMessage('TASKS_ACTIVITY_OBJECT_TASK')],
		],
	]);
}

if (defined(FieldType::class . '::DOCUMENT'))
{
	$arActivityDescription->setReturn([
		'Task' => [
			'Name' => Loc::getMessage('TASKS_GLDA_DESC_RETURN_TASK'),
			'Type' => FieldType::DOCUMENT,
			'Default' => ['tasks', Task::class, 'TASK'],
		],
	]);
}

$arActivityDescription = $arActivityDescription->toArray();
