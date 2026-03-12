<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Bizproc\Activity\ActivityDescription;
use Bitrix\Bizproc\Activity\Enum\ActivityType;
use Bitrix\Bizproc\FieldType;
use Bitrix\Main\Localization\Loc;

$arActivityDescription = (new ActivityDescription(
	name: Loc::GetMessage('CRM_ACTIVITY_CREATE_SMART_INVOICE_NAME') ?? '',
	description: Loc::GetMessage('CRM_ACTIVITY_CREATE_SMART_INVOICE_DESCRIPTION') ?? '',
	type: [ActivityType::NODE_ACTION->value],
))
	->setClass('CrmCreateSmartInvoiceActivity')
	->setReturn([
		'ItemId' => [
			'NAME' => Loc::getMessage('CRM_ACTIVITY_CREATE_SMART_INVOICE_ITEM_ID'),
			'TYPE' => FieldType::INT,
		],
		'ErrorMessage' => [
			'NAME' => Loc::getMessage('CRM_ACTIVITY_CREATE_SMART_INVOICE_ERROR_MESSAGE'),
			'TYPE' => FieldType::STRING,
		],
	])
	->toArray()
;