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

$types = [ ActivityType::ACTIVITY->value, ActivityType::NODE->value ];

if (
	isset($documentType)
	&& $documentType[0] === 'crm'
	&& CModule::IncludeModule('crm')
	&& \Bitrix\Crm\Automation\Factory::canUseBizprocDesigner()
)
{
	$types[] = ActivityType::ROBOT->value;
}

$arActivityDescription = (new ActivityDescription(
	name: Loc::getMessage('BPSWFA_DESCR_NAME_1'),
	description: Loc::getMessage('BPSWFA_DESCR_DESCR_1'),
	type: $types,
))
	->setCategory([
		'ID' => 'document',
	])
	->setClass('StartWorkflowActivity')
	->setJsClass('BizProcActivity')
	->setReturn([
		'WorkflowId' => [
			'NAME' => Loc::getMessage('BPSWFA_DESCR_WORKFLOW_ID'),
			'TYPE' => 'string',
		],
	])
	->setRobotSettings([
		'CATEGORY' => 'employee',
		'GROUP' => [ 'other' ],
		'SORT' => 3600,
	])
	->setGroups([ ActivityGroup::WORKFLOW->value ])
	->setColorIndex(ActivityColorIndex::GREY->value)
	->setIcon(Outline::BUSINES_PROCESS_STAGES->name)
	->toArray()
;
