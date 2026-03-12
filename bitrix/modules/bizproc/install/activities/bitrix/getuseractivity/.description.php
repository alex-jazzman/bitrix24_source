<?php
if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true)
{
	die();
}

use Bitrix\Bizproc\Activity\ActivityDescription;
use Bitrix\Bizproc\Activity\Enum\ActivityColorIndex;
use Bitrix\Bizproc\Activity\Enum\ActivityGroup;
use Bitrix\Bizproc\Activity\Enum\ActivityType;
use Bitrix\Bizproc\FieldType;
use Bitrix\Main\Localization\Loc;
use Bitrix\Ui\Public\Enum\IconSet\Outline;

$arActivityDescription = (new ActivityDescription(
	name: Loc::getMessage('BPGUA_DESCR_NAME') ?? '',
	description: Loc::getMessage('BPGUA_DESCR_DESCR') ?? '',
	type: [
		ActivityType::ACTIVITY->value,
		ActivityType::NODE->value,
	],
))
	->setCategory([
		'ID' => 'other',
	])
	->setClass('GetUserActivity')
	->setJsClass(ActivityDescription::DEFAULT_ACTIVITY_JS_CLASS)
	->setReturn([
		'GetUser' => [
			'NAME' => Loc::getMessage('BPGUA_DESCR_RU'),
			'TYPE' => FieldType::USER,
		],
	])
	->setGroups([
		ActivityGroup::INTERNAL_COMMUNICATION->value,
	])
	->setColorIndex(ActivityColorIndex::ORANGE->value)
	->setIcon(Outline::PERSON_SEARCH->name)
	->toArray()
;