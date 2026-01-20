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
use Bitrix\Sign;
use Bitrix\Sign\Config\Feature;
use Bitrix\Ui\Public\Enum\IconSet\Outline;

$locked = Main\Loader::includeModule('bitrix24') && !\Bitrix\Bitrix24\Feature::isFeatureEnabled('sign_automation')
	? [ 'INFO_CODE' => 'limit_crm_sign_automation' ]
	: []
;

$arActivityDescription = (new ActivityDescription(
	name: Loc::getMessage('SIGN_ACTIVITIES_SIGN_B2E_DOCUMENT_TITLE'),
	description: Loc::getMessage('SIGN_ACTIVITIES_SIGN_B2E_DOCUMENT_DESCRIPTION'),
	type: [ ActivityType::ACTIVITY->value, ActivityType::ROBOT->value, ActivityType::NODE->value ],
))
	->setCategory([
		'ID' => 'document',
		'OWN_ID' => 'crm',
		'OWN_NAME' => 'CRM',
	])
	->setClass('SignB2EDocumentActivity')
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
		'RESPONSIBLE_PROPERTY' => 'employee',
		'SORT' => 1300,
	])
	->set('EXCLUDED', (
		!Main\Loader::includeModule('sign')
		|| !Main\Loader::includeModule('crm')
		|| !Sign\Config\Storage::instance()->isB2eAvailable()
		|| !Feature::instance()->isB2eRobotEnabled()
	))
	->setReturn([
		'documentId' => [
			'NAME' => Loc::getMessage('SIGN_ACTIVITIES_SIGN_B2E_DOCUMENT_ID'),
			'TYPE' => 'int',
		],
		'documentStatus' => [
			'NAME' => Loc::getMessage('SIGN_ACTIVITIES_SIGN_B2E_DOCUMENT_STATUS'),
			'TYPE' => 'string',
		],
	])
	->setGroups([ ActivityGroup::SIGN->value ])
	->setColorIndex(ActivityColorIndex::ORANGE->value)
	->setIcon(Outline::DOCUMENT_SIGN->name)
	->set('LOCKED', $locked)
	->toArray()
;
