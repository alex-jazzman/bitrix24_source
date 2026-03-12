<?php

declare(strict_types=1);

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) {
	die();
}

use Bitrix\Bizproc\Activity\ActivityDescription;
use Bitrix\Bizproc\Activity\Enum\ActivityColorIndex;
use Bitrix\Bizproc\Activity\Enum\ActivityGroup;
use Bitrix\Bizproc\Activity\Enum\ActivityType;
use Bitrix\Bizproc\FieldType;
use Bitrix\Main\Localization\Loc;
use Bitrix\Ui\Public\Enum\IconSet\Outline;
use Bitrix\Main\Config\Option;

$arActivityDescription = (new ActivityDescription(
	name: Loc::getMessage('TASKS_GET_INFO_NAME'),
	description: Loc::getMessage('TASKS_GET_INFO_DESCR'),
	type: [ActivityType::NODE->value],
))
	->setClass('TasksGetInfoActivity')
	->setJsClass('BizProcActivity')
	->setGroups([ ActivityGroup::TASK_DISTRIBUTION->value, ActivityGroup::TASK_MANAGEMENT->value ])
	->setReturn([
		'TASKS_INFO_JSON' => [
			'NAME' => Loc::getMessage('TASKS_GET_INFO_RETURN_FIELD_TASKS_INFO'),
			'TYPE' => FieldType::JSON,
		],
		'COUNTER_TASKS_INFO' => [
			'NAME' => Loc::getMessage('TASKS_GET_INFO_RETURN_FIELD_COUNTER_TASKS_INFO'),
			'TYPE' => FieldType::INT,
		],
	])
	->setIcon(Outline::TASK->name)
	->setColorIndex(ActivityColorIndex::BLUE->value)
	->setExcluded(
		Option::get('bizproc', 'bitrix_ai_day_plan_available', 'N') === 'N',
	)
	->toArray();
