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
	name: Loc::getMessage('SIGN_ACTIVITIES_SIGN_B2E_DOCUMENT_CONFIGURE_TITLE'),
	description: Loc::getMessage('SIGN_ACTIVITIES_SIGN_B2E_DOCUMENT_CONFIGURE_DESCRIPTION'),
	type: [ ActivityType::ROBOT->value, ActivityType::NODE->value ],
))
	->setCategory([
		'ID' => 'document',
		'OWN_ID' => 'crm',
		'OWN_NAME' => 'CRM',
	])
	->setClass('SignB2EDocumentConfigureActivity')
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
		'RESPONSIBLE_PROPERTY' => 'representative',
		'SORT' => 1291,
	])
	->setExcluded(!$isChainAvailable)
	->setReturn([
		'configurationStatus' => [
			'NAME' => Loc::getMessage('SIGN_ACTIVITIES_SIGN_B2E_DOCUMENT_CONFIGURE_CONFIGURATION_STATUS'),
			'TYPE' => 'string',
		],
		'resultDocumentId' => [
			'NAME' => Loc::getMessage('SIGN_ACTIVITIES_SIGN_B2E_DOCUMENT_CONFIGURE_RETURN_DOCUMENT_ID'),
			'TYPE' => 'int',
		],
		'documentStatus' => [
			'NAME' => Loc::getMessage('SIGN_ACTIVITIES_SIGN_B2E_DOCUMENT_CONFIGURE_RETURN_DOCUMENT_STATUS'),
			'TYPE' => 'string',
		],
		'smartDocumentId' => [
			'NAME' => Loc::getMessage('SIGN_ACTIVITIES_SIGN_B2E_DOCUMENT_CONFIGURE_RETURN_SMART_DOCUMENT_ID'),
			'TYPE' => 'int',
		],
	])
	->setGroups([ ActivityGroup::SIGN->value ])
	->setColorIndex(ActivityColorIndex::ORANGE->value)
	->setIcon(Outline::SETTINGS->name)
	->setLocked($locked)
	->toArray()
;
