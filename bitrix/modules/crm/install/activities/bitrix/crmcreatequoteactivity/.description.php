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
	name: Loc::getMessage('CRM_ACTIVITY_CREATE_QUOTE_NAME') ?? '',
	description: Loc::getMessage('CRM_ACTIVITY_CREATE_QUOTE_DESCRIPTION') ?? '',
	type: [ActivityType::NODE_ACTION->value],
))
	->setClass('CrmCreateQuoteActivity')
	->setReturn([
		'ItemId' => [
			'NAME' => Loc::getMessage('CRM_ACTIVITY_CREATE_QUOTE_ITEM_ID'),
			'TYPE' => FieldType::INT,
		],
		'ErrorMessage' => [
			'NAME' => Loc::getMessage('CRM_ACTIVITY_CREATE_QUOTE_ERROR_MESSAGE'),
			'TYPE' => FieldType::STRING,
		],
	])
	->toArray()
;