<?php

use Bitrix\Bizproc\Activity\ActivityDescription;
use Bitrix\Bizproc\Activity\Enum\ActivityColorIndex;
use Bitrix\Bizproc\Activity\Enum\ActivityGroup;
use Bitrix\Bizproc\Activity\Enum\ActivityNodeType;
use Bitrix\Bizproc\Activity\Enum\ActivityType;
use Bitrix\Main\Localization\Loc;
use Bitrix\Ui\Public\Enum\IconSet\Outline;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die;
}

use Bitrix\Bizproc\Activity\Dto\Complex;

$arActivityDescription = (new ActivityDescription(
	name: Loc::GetMessage('TASKS_COMPLEX_ACTIVITY_NAME'),
	description: Loc::GetMessage('TASKS_COMPLEX_ACTIVITY_DESCRIPTION'),
	type: [ActivityType::NODE->value],
))
	->setClass('TasksComplexActivity')
	->setCategory([
		'OWN_ID' => 'tasks',
		'OWN_NAME' => Loc::getMessage('TASKS_COMPLEX_ACTIVITY_NAME'),
	])
	->setNodeType(ActivityNodeType::COMPLEX->value)
	->setGroups([ ActivityGroup::TASK_DISTRIBUTION->value, ActivityGroup::TASK_MANAGEMENT->value ])
	->setColorIndex(ActivityColorIndex::BLUE->value)
	->setIcon(Outline::TASK->name)
	->setExcluded(
		(bool)\Bitrix\Main\Config\Option::get('bizproc', 'complex_activity_excluded', 1),
	)
	->setComplexActivitySettings(
		new Complex\Settings(
			actionDictionary: new Complex\NodeActionDictionary(
				new Complex\NodeAction(
					activityCode: 'task2activity',
					sort: 100,
				),
				new Complex\NodeAction(
					activityCode: 'tasksgetdocumentactivity',
					sort: 200,
				),
				new Complex\NodeAction(
					activityCode: 'tasksupdatetaskactivity',
					sort: 300,
				),
				new Complex\NodeAction(
					activityCode: 'taskschangestatusactivity',
					customName: Loc::getMessage('TASKS_COMPLEX_ACTIVITY_NODE_ACTION_CHANGE_STATUS'),
					sort: 400,
				),
				new Complex\NodeAction(
					activityCode: 'taskschangeresponsibleactivity',
					sort: 500,
				),
				new Complex\NodeAction(
					activityCode: 'tasksdeletetaskactivity',
					customName: Loc::getMessage('TASKS_COMPLEX_ACTIVITY_NODE_ACTION_DELETE_TASK'),
					sort: 600,
				),
			),
		),
	)
	->toArray()
;
