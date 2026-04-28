<?php

declare(strict_types=1);

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Bizproc\Activity\ActivityDescription;
use Bitrix\Bizproc\Activity\Enum\ActivityColorIndex;
use Bitrix\Bizproc\Activity\Enum\ActivityGroup;
use Bitrix\Bizproc\Activity\Enum\ActivityType;
use Bitrix\Main\Loader;
use Bitrix\Main\Localization\Loc;
use Bitrix\Ui\Public\Enum\IconSet\Outline;

$isEntitySelectorAvailable = defined(\Bitrix\Bizproc\Integration\UI\EntitySelector\DocumentTypeProvider::class . '::PRESELECTED_ITEMS_SUPPORTED');

$map = [
	'LEAD' => 'LEAD',
	'DEAL' => 'DEAL',
	'CONTACT' => 'CONTACT',
	'COMPANY' => 'COMPANY',
	'ORDER' => 'ORDER',
];

if ($isEntitySelectorAvailable)
{
	$map['DEAL'] = 'crm@CCrmDocumentDeal@DEAL';
	$map['COMPANY'] = 'crm@CCrmDocumentCompany@COMPANY';
	$map['LEAD'] = 'crm@CCrmDocumentLead@LEAD';
	$map['ORDER'] = 'crm@Bitrix\Crm\Integration\BizProc\Document\Order@ORDER';
	$map['CONTACT'] = 'crm@CCrmDocumentContact@CONTACT';
}

$presets = [
	[
		'ID' => 'DEAL',
		'NAME' => Loc::getMessage('BP_CRM_DEAL_FCT_DESCR_NAME'),
		'DESCRIPTION' => Loc::getMessage('BP_CRM_DEAL_FCT_DESCR_DESCR'),
		'PROPERTIES' => [ 'Document' => $map['DEAL'] ],
		'NODE_ICON' => Outline::HANDSHAKE->name,
	],
	[
		'ID' => 'CONTACT',
		'NAME' => Loc::getMessage('BP_CRM_CONTACT_FCT_DESCR_NAME'),
		'DESCRIPTION' => Loc::getMessage('BP_CRM_CONTACT_FCT_DESCR_DESCR'),
		'PROPERTIES' => [ 'Document' => $map['CONTACT'] ],
		'NODE_ICON' => Outline::CONTACT->name,
	],
	[
		'ID' => 'COMPANY',
		'NAME' => Loc::getMessage('BP_CRM_COMPANY_FCT_DESCR_NAME'),
		'DESCRIPTION' => Loc::getMessage('BP_CRM_COMPANY_FCT_DESCR_DESCR'),
		'PROPERTIES' => [ 'Document' => $map['COMPANY'] ],
		'NODE_ICON' => Outline::COMPANY->name,
	],
	[
		'ID' => 'LEAD',
		'NAME' => Loc::getMessage('BP_CRM_LEAD_FCT_DESCR_NAME'),
		'DESCRIPTION' => Loc::getMessage('BP_CRM_LEAD_FCT_DESCR_DESCR'),
		'PROPERTIES' => [ 'Document' => $map['LEAD'] ],
		'NODE_ICON' => Outline::LEAD->name,
	],
];

if ($isEntitySelectorAvailable)
{
	$presets[] = [
		'ID' => 'QUOTE',
		'NAME' => Loc::getMessage('BP_CRM_QUOTE_FCT_DESCR_NAME'),
		'DESCRIPTION' => Loc::getMessage('BP_CRM_QUOTE_FCT_DESCR_DESCR'),
		'PROPERTIES' => [ 'Document' => 'crm@\Bitrix\Crm\Integration\BizProc\Document\Quote@QUOTE' ],
		'NODE_ICON' => Outline::SUITCASE->name,
	];
	$presets[] = [
		'ID' => 'AUTOMATED_SOLUTION',
		'NAME' => Loc::getMessage('BP_CRM_AUTOMATED_SOLUTION_FCT_DESCR_NAME'),
		'DESCRIPTION' => Loc::getMessage('BP_CRM_AUTOMATED_SOLUTION_FCT_DESCR_DESCR'),
		'PROPERTIES' => [ 'IsAutomatedSolution' => 'Y' ],
		'NODE_ICON' => Outline::SMART_PROCESS->name,
	];
	$presets[] = [
		'ID' => 'DYNAMIC',
		'NAME' => Loc::getMessage('BP_CRM_DYNAMIC_FCT_DESCR_NAME'),
		'DESCRIPTION' => Loc::getMessage('BP_CRM_DYNAMIC_FCT_DESCR_DESCR'),
		'NODE_ICON' => Outline::SMART_PROCESS->name,
	];
}

if (Loader::includeModule('crm') && \CCrmSaleHelper::isWithOrdersMode())
{
	$presets[] = [
		'ID' => 'ORDER',
		'NAME' => Loc::getMessage('BP_CRM_ORDER_FCT_DESCR_NAME'),
		'DESCRIPTION' => Loc::getMessage('BP_CRM_ORDER_FCT_DESCR_DESCR'),
		'PROPERTIES' => [ 'Document' => $map['ORDER'] ],
		'NODE_ICON' => Outline::CHANGE_ORDER->name,
	];
}

$arActivityDescription = (new ActivityDescription(
	name: '',
	description: '',
	type: [ ActivityType::TRIGGER->value ],
))
	->setClass('CrmEntityFieldChangedTrigger')
	->setCategory(['ID' => 'document'])
	->setPresets($presets)
	->set('ADDITIONAL_RESULT', ['Return'])
	->setGroups([ActivityGroup::STARTER->value])
	->setColorIndex(ActivityColorIndex::BLUE->value)
	->toArray()
;
