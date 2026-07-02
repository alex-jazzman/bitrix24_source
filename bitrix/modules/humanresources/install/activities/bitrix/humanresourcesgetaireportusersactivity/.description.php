<?php

declare(strict_types=1);

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Bizproc\Activity\ActivityDescription;
use Bitrix\Bizproc\Activity\Enum\ActivityColorIndex;
use Bitrix\Bizproc\Activity\Enum\ActivityGroup;
use Bitrix\Bizproc\Activity\Enum\ActivityNodeType;
use Bitrix\Bizproc\Activity\Enum\ActivityType;
use Bitrix\Bizproc\FieldType;
use Bitrix\Main\Localization\Loc;
use Bitrix\Ui\Public\Enum\IconSet\Outline;

$arActivityDescription = (new ActivityDescription(
	Loc::getMessage('HUMAN_RESOURCES_GET_AI_REPORT_USERS_ACTIVITY_NAME') ?? '',
	Loc::getMessage('HUMAN_RESOURCES_GET_AI_REPORT_USERS_ACTIVITY_DESCRIPTION') ?? '',
	[ActivityType::NODE->value],
))
	->setClass('HumanResourcesGetAiReportUsersActivity')
	->setJsClass('BizProcActivity')
	->setNodeType(ActivityNodeType::SIMPLE->value)
	->setGroups([ActivityGroup::HR->value])
	->setColorIndex(ActivityColorIndex::BLUE->value)
	->setIcon(Outline::PERSON_SEARCH->name)
	->setSort(500)
	->setReturn([
		'Users' => [
			'NAME' => Loc::getMessage('HUMAN_RESOURCES_GET_AI_REPORT_USERS_ACTIVITY_RETURN_USERS') ?? '',
			'TYPE' => FieldType::USER,
			'MULTIPLE' => true,
		],
		'Heads' => [
			'NAME' => Loc::getMessage('HUMAN_RESOURCES_GET_AI_REPORT_USERS_ACTIVITY_RETURN_HEADS') ?? '',
			'TYPE' => FieldType::USER,
			'MULTIPLE' => true,
		],
	])
	->toArray()
;
