<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Bizproc\Activity\ActivityDescription;
use Bitrix\Bizproc\Activity\Enum\ActionArea;
use Bitrix\Bizproc\Activity\Enum\ActionGroup;
use Bitrix\Bizproc\Activity\Enum\ActivityType;
use Bitrix\Bizproc\FieldType;
use Bitrix\Main\Localization\Loc;

$description = (new ActivityDescription(
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
;

if (
	enum_exists('\Bitrix\Bizproc\Activity\Enum\ActionGroup')
	&& enum_exists('\Bitrix\Bizproc\Activity\Enum\ActionArea')
)
{
	$description->setNodeActionSettings([
		'HANDLES_DOCUMENT' => false,
		'ACTION_GROUP' => ActionGroup::CREATE->value,
		'ACTION_AREA' => ActionArea::CRM->value,
		'ACTION_OBJECTS' => [
			['id' => 'crm_invoice', 'title' => Loc::getMessage('CRM_ACTIVITY_OBJECT_INVOICE')],
		],
		'CREATES_DOCUMENT' => true,
	]);
}

$arActivityDescription = $description->toArray();