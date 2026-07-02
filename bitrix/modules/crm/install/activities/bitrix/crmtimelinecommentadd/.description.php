<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Bizproc\Activity\ActivityDescription;
use Bitrix\Bizproc\Activity\Enum\ActivityColorIndex;
use Bitrix\Bizproc\Activity\Enum\ActivityGroup;
use Bitrix\Bizproc\Activity\Enum\ActivityType;
use Bitrix\Main\Localization\Loc;
use Bitrix\Ui\Public\Enum\IconSet\Outline;

$arActivityDescription = (new ActivityDescription(
	name: Loc::getMessage('BPCTLCA_NAME_1') ?? '',
	description: Loc::getMessage('BPCTLCA_DESCRIPTION_1') ?? '',
	type: [
		ActivityType::ACTIVITY->value,
		ActivityType::ROBOT->value,
		ActivityType::NODE_ACTION->value,
	],
))
	->setClass('CrmTimelineCommentAdd')
	->setJsClass(ActivityDescription::DEFAULT_ACTIVITY_JS_CLASS)
	->setCategory([
		'ID' => 'document',
		'OWN_ID' => 'crm',
		'OWN_NAME' => 'CRM',
	])
	->setFilter([
		'INCLUDE' => [
			['crm'],
		],
	])
	->setRobotSettings([
		'CATEGORY' => 'employee',
		'GROUP' => ['informingEmployee'],
		'SORT' => 800,
	])
	->setNodeActionSettings([
		'HANDLES_DOCUMENT' => true,
	])
	->setColorIndex(ActivityColorIndex::BLUE->value)
	->setGroups([
		ActivityGroup::INTERNAL_COMMUNICATION->value,
	])
	->setIcon(Outline::ADD_TIMELINE->name)
	->setAiDescription('Adds a comment from a specified employee to the CRM entity timeline')
	->toArray()
;