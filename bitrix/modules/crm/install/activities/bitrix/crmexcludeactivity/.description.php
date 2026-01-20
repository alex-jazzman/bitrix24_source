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
	name: Loc::getMessage('CRM_EXA_DESCR_NAME_1'),
	description: Loc::getMessage('CRM_EXA_DESCR_DESCR_1'),
	type: [ ActivityType::ACTIVITY->value, ActivityType::ROBOT->value, ActivityType::NODE->value ],
))
	->setCategory([
		'ID' => 'document',
		'OWN_ID' => 'crm',
		'OWN_NAME' => 'CRM',
	])
	->setClass('CrmExcludeActivity')
	->setJsClass('BizProcActivity')
	->setFilter([
		'INCLUDE' => [
			[ 'crm', 'CCrmDocumentLead' ],
			[ 'crm', 'CCrmDocumentDeal' ],
		],
	])
	->setRobotSettings([
		'CATEGORY' => 'employee',
		'GROUP' => [ 'clientData' ],
		'SORT' => 4700,
	])
	->setGroups([ ActivityGroup::CLIENT_BASE->value ])
	->setColorIndex(ActivityColorIndex::GREY->value)
	->setIcon(Outline::BLACK_LIST->name)
	->toArray()
;
