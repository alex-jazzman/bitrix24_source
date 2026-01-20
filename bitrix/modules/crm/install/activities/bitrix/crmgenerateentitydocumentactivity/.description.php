<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Bizproc\Activity\ActivityDescription;
use Bitrix\Bizproc\Activity\Enum\ActivityColorIndex;
use Bitrix\Bizproc\Activity\Enum\ActivityGroup;
use Bitrix\Bizproc\Activity\Enum\ActivityType;
use Bitrix\Crm\Integration\BizProc\Document\SmartB2eDocument;
use Bitrix\Crm\Integration\BizProc\Document\SmartDocument;
use Bitrix\Crm\Integration\DocumentGeneratorManager;
use Bitrix\Main\Loader;
use Bitrix\Main\Localization\Loc;
use Bitrix\Ui\Public\Enum\IconSet\Outline;

$arActivityDescription = (new ActivityDescription(
	name: Loc::getMessage('CRM_ACTIVITY_GENERATE_ENTITY_DOCUMENT_NAME_1'),
	description: Loc::getMessage('CRM_ACTIVITY_GENERATE_ENTITY_DOCUMENT_DESC_1_MSGVER_1'),
	type: [ ActivityType::ACTIVITY->value, ActivityType::ROBOT->value ],
))
	->setCategory([
		'ID' => 'document',
		'OWN_ID' => 'crm',
		'OWN_NAME' => 'CRM',
	])
	->setClass('CrmGenerateEntityDocumentActivity')
	->setJsClass('BizProcActivity')
	->setFilter([
		'INCLUDE' => [
			[ 'crm' ],
		],
		'EXCLUDE' => [
			[ 'crm', SmartDocument::class ],
			[ 'crm', SmartB2eDocument::class ],
		],
	])
	->setReturn([
		'DocumentId' => [
			'NAME' => Loc::getMessage('CRM_ACTIVITY_GENERATE_ENTITY_DOCUMENT_ID'),
			'TYPE' => 'int',
		],
		'DocumentUrl' => [
			'NAME' => Loc::getMessage('CRM_ACTIVITY_GENERATE_ENTITY_DOCUMENT_URL'),
			'TYPE' => 'string',
		],
		'DocumentPdf' => [
			'NAME' => Loc::getMessage('CRM_ACTIVITY_GENERATE_ENTITY_PDF_FILE'),
			'TYPE' => 'file',
		],
		'DocumentDocx' => [
			'NAME' => Loc::getMessage('CRM_ACTIVITY_GENERATE_ENTITY_DOCX_FILE'),
			'TYPE' => 'file',
		],
		'DocumentNumber' => [
			'NAME' => Loc::getMessage('CRM_ACTIVITY_GENERATE_ENTITY_DOCUMENT_NUMBER'),
			'TYPE' => 'string',
		],
	])
	->setRobotSettings([
		'CATEGORY' => 'employee',
		'GROUP' => [ 'paperwork' ],
		'ASSOCIATED_TRIGGERS' => [
			'DOCUMENT_VIEW' => 1,
			'DOCUMENT_CREATE' => 2,
		],
		'SORT' => 1400,
	])
	->setGroups([ ActivityGroup::DOCUMENT_FLOW->value ])
	->setColorIndex(ActivityColorIndex::BLUE->value)
	->setIcon(Outline::FILE->name)
	->setExcluded(
		Loader::includeModule('crm')
		&& !DocumentGeneratorManager::getInstance()->isEnabled()
	)
	->toArray()
;

