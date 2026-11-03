<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Bizproc\Activity\ActivityDescription;
use Bitrix\Bizproc\Activity\Enum\ActivityColorIndex;
use Bitrix\Bizproc\Activity\Enum\ActivityGroup;
use Bitrix\Bizproc\Activity\Enum\ActivityType;
use Bitrix\Main;
use Bitrix\Main\Localization\Loc;
use Bitrix\Sign\Config\Feature;
use Bitrix\Ui\Public\Enum\IconSet\Outline;

$locked = Main\Loader::includeModule('bitrix24') && !\Bitrix\Bitrix24\Feature::isFeatureEnabled('sign_automation')
	? [ 'INFO_CODE' => 'limit_crm_sign_automation' ]
	: []
;

$isChainAvailable =
	Main\Loader::includeModule('sign')
	&& Main\Loader::includeModule('crm')
	&& Feature::instance()->isB2eBizprocChainEnabled()
;

$arActivityDescription = (new ActivityDescription(
	name: Loc::getMessage('SIGN_ACTIVITIES_SIGN_B2E_DOCUMENT_DRAFT_TITLE'),
	description: Loc::getMessage('SIGN_ACTIVITIES_SIGN_B2E_DOCUMENT_DRAFT_DESCRIPTION'),
	type: [ ActivityType::ROBOT->value, ActivityType::NODE->value ],
))
	->setCategory([
		'ID' => 'document',
		'OWN_ID' => 'crm',
		'OWN_NAME' => 'CRM',
	])
	->setClass('SignB2EDocumentDraftActivity')
	->setJsClass('BizProcActivity')
	->setFilter([
		'INCLUDE' => [
			[ 'crm', \Bitrix\Crm\Integration\BizProc\Document\Dynamic::class ],
		],
	])
	->setRobotSettings([
		'CATEGORY' => 'employee',
		'GROUP' => [ 'paperwork' ],
		'IS_SUPPORTING_ROBOT' => false,
		'RESPONSIBLE_PROPERTY' => 'responsible',
		'SORT' => 1290,
	])
	->setExcluded(!$isChainAvailable)
	->setReturn([
		'creationStatus' => [
			'NAME' => Loc::getMessage('SIGN_ACTIVITIES_SIGN_B2E_DOCUMENT_DRAFT_CREATION_STATUS'),
			'TYPE' => 'string',
		],
		'documentId' => [
			'NAME' => Loc::getMessage('SIGN_ACTIVITIES_SIGN_B2E_DOCUMENT_DRAFT_DOCUMENT_ID'),
			'TYPE' => 'int',
		],
		'documentStatus' => [
			'NAME' => Loc::getMessage('SIGN_ACTIVITIES_SIGN_B2E_DOCUMENT_DRAFT_DOCUMENT_STATUS'),
			'TYPE' => 'string',
		],
		'smartDocumentId' => [
			'NAME' => Loc::getMessage('SIGN_ACTIVITIES_SIGN_B2E_DOCUMENT_DRAFT_SMART_DOCUMENT_ID'),
			'TYPE' => 'int',
		],
	])
	->setGroups([ ActivityGroup::SIGN->value ])
	->setColorIndex(ActivityColorIndex::ORANGE->value)
	->setIcon(Outline::DOCUMENT_SIGN->name)
	->setLocked($locked)
	->toArray()
;
