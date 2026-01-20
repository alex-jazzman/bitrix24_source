<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Bizproc\Activity\ActivityDescription;
use Bitrix\Bizproc\Activity\Enum\ActivityColorIndex;
use Bitrix\Bizproc\Activity\Enum\ActivityGroup;
use Bitrix\Bizproc\Activity\Enum\ActivityNodeType;
use Bitrix\Bizproc\Activity\Enum\ActivityType;
use Bitrix\Main\Localization\Loc;
use Bitrix\Ui\Public\Enum\IconSet\Outline;

$arActivityDescription = (new ActivityDescription(
	name: Loc::GetMessage('CRM_COMPLEX_ACTIVITY_DEAL_NAME') ?? '',
	description: Loc::GetMessage('CRM_COMPLEX_ACTIVITY_DEAL_DESCRIPTION') ?? '',
	type: [ ActivityType::NODE->value ],
))
	->setCategory([
		'ID' => 'crm',
		'OWN_ID' => 'crm',
		'OWN_NAME' => 'CRM',
	])
	->setClass('CrmDealComplexActivity')
	->setNodeType(ActivityNodeType::COMPLEX->value)
	->setExcluded(
		(bool)\Bitrix\Main\Config\Option::get('bizproc', 'complex_activity_excluded', 1), // temporary, remove when ready
	)
	->setIcon(Outline::HANDSHAKE->name)
	->setColorIndex(ActivityColorIndex::BLUE->value)
	->setGroups([ ActivityGroup::SALES_CRM->value ])
	->toArray()
;
