<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

if (!class_exists(\Bitrix\Bizproc\Activity\ActivityDescription::class))
{
	return;
}

use Bitrix\Bizproc\Activity\ActivityDescription;
use Bitrix\Bizproc\Activity\Enum\ActivityColorIndex;
use Bitrix\Bizproc\Activity\Enum\ActivityGroup;
use Bitrix\Bizproc\Activity\Enum\ActivityType;
use Bitrix\Bizproc\FieldType;
use Bitrix\Main;
use Bitrix\Main\Localization\Loc;
use Bitrix\Sign\Config\Feature;
use Bitrix\Ui\Public\Enum\IconSet\Outline;

$arActivityDescription = (new ActivityDescription(
	name: Loc::getMessage('SIGN_ACTIVITIES_B2E_MANUAL_START_TRIGGER_NAME'),
	description: Loc::getMessage('SIGN_ACTIVITIES_B2E_MANUAL_START_TRIGGER_DESCRIPTION'),
	type: [ ActivityType::TRIGGER->value ],
))
	->setClass('SignB2EManualStartTrigger')
	->setCategory([ 'ID' => 'document' ])
	->setGroups([
		ActivityGroup::STARTER->value,
		ActivityGroup::SIGN->value,
	])
	->setColorIndex(ActivityColorIndex::ORANGE->value)
	->setIcon(Outline::DOCUMENT_SIGN->name)
	// The flag closes the catalog of the constructor only: a scheme already saved keeps running.
	->setExcluded(
		!Main\Loader::includeModule('sign')
		|| !Main\Loader::includeModule('crm')
		|| !Feature::instance()->isKedoRunProcessEnabled()
	)
	->setReturn([
		'EmployeeId' => [
			'Name' => Loc::getMessage('SIGN_ACTIVITIES_B2E_MANUAL_START_TRIGGER_RETURN_EMPLOYEE') ?? '',
			'Type' => FieldType::USER,
			'Default' => null,
		],
		'InitiatorId' => [
			'Name' => Loc::getMessage('SIGN_ACTIVITIES_B2E_MANUAL_START_TRIGGER_RETURN_INITIATOR') ?? '',
			'Type' => FieldType::USER,
			'Default' => null,
		],
		'StartedDate' => [
			'Name' => Loc::getMessage('SIGN_ACTIVITIES_B2E_MANUAL_START_TRIGGER_RETURN_STARTED_DATE') ?? '',
			'Type' => FieldType::DATETIME,
			'Default' => null,
		],
	])
	->setAdditionalResult([ 'Return' ])
	->toArray()
;
