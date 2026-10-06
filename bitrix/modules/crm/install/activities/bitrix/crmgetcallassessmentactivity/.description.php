<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Bizproc\Activity\ActivityDescription;
use Bitrix\Bizproc\Activity\Enum\ActivityColorIndex;
use Bitrix\Bizproc\Activity\Enum\ActivityGroup;
use Bitrix\Bizproc\Activity\Enum\ActivityType;
use Bitrix\Bizproc\FieldType;
use Bitrix\Crm\Integration\AI\AIManager;
use Bitrix\Main\Loader;
use Bitrix\Main\Localization\Loc;
use Bitrix\Ui\Public\Enum\IconSet\Outline;

if (
	!class_exists(ActivityDescription::class)
	|| !Loader::includeModule('crm')
)
{
	return;
}

$instance = new ActivityDescription(
	Loc::getMessage('CRM_GCAA_NAME'),
	Loc::getMessage('CRM_GCAA_DESCRIPTION'),
	[ActivityType::NODE->value],
);

$arActivityDescription = $instance
	->setClass('CrmGetCallAssessmentActivity')
	->setCategory([
		'ID' => 'crm',
		'OWN_ID' => 'crm',
		'OWN_NAME'=> 'CRM',
	])
	->setGroups([ActivityGroup::CLIENT_COMMUNICATION->value]) // @todo
	->setColorIndex(ActivityColorIndex::ORANGE->value) // @todo
	->setIcon(Outline::QUANTITY->name) // @todo
	->setReturn([
		'CallQuality' => [
			'NAME' => Loc::getMessage('CRM_GCAA_QUALITY'),
			'TYPE' => FieldType::INT,
		],
	])
	->setExcluded(!AIManager::isCallScoringV2Enabled())
	->toArray()
;
