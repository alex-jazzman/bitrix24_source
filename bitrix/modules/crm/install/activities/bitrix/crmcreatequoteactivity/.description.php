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
			['id' => 'crm_quote', 'title' => Loc::getMessage('CRM_ACTIVITY_OBJECT_QUOTE')],
		],
		'CREATES_DOCUMENT' => true,
	]);
}

$arActivityDescription = $description->toArray();