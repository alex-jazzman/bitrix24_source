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
	name: Loc::getMessage('CRM_ACTIVITY_CREATE_CONTACT_NAME') ?? '',
	description: Loc::getMessage('CRM_ACTIVITY_CREATE_CONTACT_DESC') ?? '',
	type: [
		ActivityType::ACTIVITY->value,
		ActivityType::NODE_ACTION->value,
	],
))
	->setClass('CreateCrmContactDocumentActivity')
	->setJsClass(ActivityDescription::DEFAULT_ACTIVITY_JS_CLASS)
	->setReturn([
		'ContactId' => [
			'NAME' => Loc::getMessage('CRM_ACTIVITY_CREATE_CONTACT_ID'),
			'TYPE' => FieldType::INT,
		],
		'ErrorMessage' => [
			'NAME' => Loc::getMessage('CRM_ACTIVITY_CREATE_ERROR_MESSAGE'),
			'TYPE' => FieldType::STRING,
		],
	])
	->setCategory([
		'ID' => 'document',
		'OWN_ID' => 'crm',
		'OWN_NAME'=> 'CRM',
	])
	->toArray()
;
