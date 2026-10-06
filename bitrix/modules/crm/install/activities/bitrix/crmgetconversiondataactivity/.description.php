<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Bizproc\Activity\ActivityDescription;
use Bitrix\Bizproc\Activity\Enum\ActivityType;
use Bitrix\Main\Localization\Loc;

$arActivityDescription =
	(new ActivityDescription(
		name: Loc::getMessage('CRM_GCDA_NAME'),
		description: Loc::getMessage('CRM_GCDA_DESC'),
		type: [
			ActivityType::NODE_ACTION->value,
		],
	))
	->setClass('CrmGetConversionDataActivity')
	->setJsClass('BizProcActivity')
	->setCategory([
		'ID' => 'document',
		'OWN_ID' => 'crm',
		'OWN_NAME' => 'CRM',
	])
	->setFilter([
		'INCLUDE' => [
			['crm', 'CCrmDocumentLead'],
			['crm', 'CCrmDocumentDeal'],
		],
	])
	->setNodeActionSettings([
		'HANDLES_DOCUMENT' => true,
	])
	->setAdditionalResult(['TargetEntityFields'])
	->toArray()
;
