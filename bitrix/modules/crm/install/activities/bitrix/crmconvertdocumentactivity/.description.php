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
		name: Loc::getMessage('CRM_CVTDA_NAME'),
		description: Loc::getMessage('CRM_CVTDA_DESC_1_MSGVER_1'),
		type: [
			ActivityType::ACTIVITY->value,
			ActivityType::ROBOT->value,
			ActivityType::NODE_ACTION->value,
		],
	))
		->setClass('CrmConvertDocumentActivity')
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
		->setRobotSettings([
			'CATEGORY' => 'employee',
			'RESPONSIBLE_PROPERTY' => 'Responsible',
			'GROUP' => ['payment'],
			'SORT' => 1500,
		])
		->setReturn([
			'InvoiceId' => [
				'NAME' => Loc::getMessage('CRM_CVTDA_RETURN_INVOICE_ID'),
				'TYPE' => 'int',
			],
			'QuoteId' => [
				'NAME' => Loc::getMessage('CRM_CVTDA_RETURN_QUOTE_ID_MSGVER_1'),
				'TYPE' => 'int',
			],
			'DealId' => [
				'NAME' => Loc::getMessage('CRM_CVTDA_RETURN_DEAL_ID'),
				'TYPE' => 'int',
			],
			'ContactId' => [
				'NAME' => Loc::getMessage('CRM_CVTDA_RETURN_CONTACT_ID'),
				'TYPE' => 'int',
			],
			'CompanyId' => [
				'NAME' => Loc::getMessage('CRM_CVTDA_RETURN_COMPANY_ID'),
				'TYPE' => 'int',
			],
		])
		->setNodeActionSettings([
			'INCLUDE' => ['crmdealcomplexactivity'],
			'HANDLES_DOCUMENT' => true,
		])
		->toArray()
;

if (isset($documentType) && $documentType[2] === 'DEAL')
{
	$arActivityDescription['RETURN'] = [
		'InvoiceId' => [
			'NAME' => Loc::getMessage('CRM_CVTDA_RETURN_INVOICE_ID'),
			'TYPE' => 'int',
		],
		'QuoteId' => [
			'NAME' => Loc::getMessage('CRM_CVTDA_RETURN_QUOTE_ID_MSGVER_1'),
			'TYPE' => 'int',
		],
	];
}

if (isset($documentType) && $documentType[2] === 'LEAD')
{
	$arActivityDescription['RETURN'] = [
		'DealId' => [
			'NAME' => Loc::getMessage('CRM_CVTDA_RETURN_DEAL_ID'),
			'TYPE' => 'int',
		],
		'ContactId' => [
			'NAME' => Loc::getMessage('CRM_CVTDA_RETURN_CONTACT_ID'),
			'TYPE' => 'int',
		],
		'CompanyId' => [
			'NAME' => Loc::getMessage('CRM_CVTDA_RETURN_COMPANY_ID'),
			'TYPE' => 'int',
		],
	];
}
