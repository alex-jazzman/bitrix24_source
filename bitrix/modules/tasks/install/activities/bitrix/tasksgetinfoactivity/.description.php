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
		'TASKS_TITLES_LIST' => [
			'NAME' => Loc::getMessage('TASKS_GET_INFO_RETURN_FIELD_TASKS_TITLES_LIST'),
			'TYPE' => FieldType::TEXT,
		],
		'TASKS_TITLES_BB_LIST' => [
			'NAME' => Loc::getMessage('TASKS_GET_INFO_RETURN_FIELD_TASKS_TITLES_BB_LIST'),
			'TYPE' => FieldType::TEXT,
		],
		'TASKS_BLOCK_ITEMS_JSON' => [
			'NAME' => Loc::getMessage('TASKS_GET_INFO_RETURN_FIELD_TASKS_BLOCK_ITEMS_JSON'),
			'TYPE' => FieldType::TEXT,
		],
		'TASK_IDS' => [
			'NAME' => Loc::getMessage('TASKS_GET_INFO_RETURN_FIELD_TASK_IDS'),
			'TYPE' => FieldType::INT,
			'MULTIPLE' => true,
		],
		'TASKS_INFO_HAS_MORE' => [
			'NAME' => Loc::getMessage('TASKS_GET_INFO_RETURN_FIELD_HAS_MORE'),
			'TYPE' => FieldType::BOOL,
		],
		'Succeeded' => [
			'NAME' => Loc::getMessage('TASKS_GET_INFO_RETURN_FIELD_SUCCEEDED'),
			'TYPE' => FieldType::BOOL,
		],
	])
	->setIcon(Outline::TASK->name)
	->setColorIndex(ActivityColorIndex::BLUE->value)
	->setExcluded(
		Option::get('bizproc', 'bitrix_ai_day_plan_available', 'N') === 'N',
	)
	->toArray();
