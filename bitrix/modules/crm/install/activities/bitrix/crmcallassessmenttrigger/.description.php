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
use Bitrix\Bizproc\FieldType;
use Bitrix\Crm\Copilot\CallAssessment\Enum\CallType;
use Bitrix\Crm\Copilot\CallAssessment\Enum\ClientType;
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
	Loc::getMessage('BP_CRM_CAT_NAME'),
	Loc::getMessage('BP_CRM_CAT_DESCRIPTION'),
	[ActivityType::TRIGGER->value],
);

$isCallScoringV2Enabled = AIManager::isCallScoringV2Enabled();

$callAssessments = [];
if ($isCallScoringV2Enabled)
{
	CBPRuntime::getRuntime()->includeActivityFile('CrmCallAssessmentTrigger');
	$callAssessments = \CBPCrmCallAssessmentTrigger::getCallAssessmentOptions();
}

$entityTypes = [
	CCrmOwnerType::Lead => CCrmOwnerType::GetDescription(CCrmOwnerType::Lead),
	CCrmOwnerType::Deal => CCrmOwnerType::GetDescription(CCrmOwnerType::Deal),
	CCrmOwnerType::Contact => CCrmOwnerType::GetDescription(CCrmOwnerType::Contact),
	CCrmOwnerType::Company => CCrmOwnerType::GetDescription(CCrmOwnerType::Company),
];
$clientTypes = ClientType::toArray();
$callTypes = CallType::toArray();

$arActivityDescription = $instance
	->setClass('CrmCallAssessmentTrigger')
	->setCategory([
		'ID' => 'crm',
		'OWN_ID' => 'crm',
		'OWN_NAME'=> 'CRM',
	])
	->setExcluded(!$isCallScoringV2Enabled)
	->setGroups([ActivityGroup::STARTER->value]) // @todo
	->setColorIndex(ActivityColorIndex::ORANGE->value) // @todo
	->setIcon(Outline::HANDSHAKE->name) // @todo
	->setReturn([
		'AssessmentSettingsId' => [
			'NAME' => Loc::getMessage('BP_CRM_CAT_RETURN_CALL_ASSESSMENT_ID'),
			'TYPE' => FieldType::SELECT,
			'OPTIONS' => $callAssessments,
		],
		'ActivityId' => [
			'NAME' => Loc::getMessage('BP_CRM_CAT_RETURN_ACTIVITY_ID'),
			'TYPE' => FieldType::INT,
		],
		'UserId' => [
			'NAME' => Loc::getMessage('BP_CRM_CAT_RETURN_USER_ID'),
			'TYPE' => FieldType::INT,
		],
		'EventDateTime' => [
			'NAME' => Loc::getMessage('BP_CRM_CALL_ASSESSMENT_TRIGGER_RETURN_EVENT_DATE_TIME'),
			'TYPE' => FieldType::DATETIME,
		],
		'Transcription' => [
			'NAME' => Loc::getMessage('BP_CRM_CAT_RETURN_TRANSCRIPTION'),
			'TYPE' => FieldType::STRING,
		],
		'ClientType' => [
			'NAME' => Loc::getMessage('BP_CRM_CAT_RETURN_CLIENT_TYPE'),
			'TYPE' => FieldType::SELECT,
			'OPTIONS' => $clientTypes,
		],
		'CallType' => [
			'NAME' => Loc::getMessage('BP_CRM_CAT_RETURN_CALL_TYPE'),
			'TYPE' => FieldType::SELECT,
			'OPTIONS' => $callTypes,
		],
	])
	->toArray()
;
