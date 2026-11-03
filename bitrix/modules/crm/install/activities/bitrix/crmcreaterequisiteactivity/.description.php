<?php

declare(strict_types=1);

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Bizproc\Activity\ActivityDescription;
use Bitrix\Bizproc\Activity\Enum\ActivityType;
use Bitrix\Bizproc\FieldType;
use Bitrix\Crm\Feature;
use Bitrix\Crm\Feature\CreateRequisiteBizprocActivity;
use Bitrix\Crm\Integration\BizProc\Document\Dynamic;
use Bitrix\Crm\Integration\BizProc\Document\Invoice;
use Bitrix\Crm\Integration\BizProc\Document\Quote;
use Bitrix\Crm\Integration\BizProc\Document\SmartB2eDocument;
use Bitrix\Crm\Integration\BizProc\Document\SmartDocument;
use Bitrix\Main\Localization\Loc;

Loc::loadMessages(__DIR__ . '/crmcreaterequisiteactivity.php');

$arActivityDescription =
	(new ActivityDescription(
		name: Loc::getMessage('CRM_CREATE_REQUISITE_ACTIVITY_NAME') ?: 'Create requisite',
		description: Loc::getMessage('CRM_CREATE_REQUISITE_ACTIVITY_DESCRIPTION') ?: 'Creates a CRM requisite or returns an existing one.',
		type: [
			ActivityType::ROBOT->value,
			ActivityType::NODE_ACTION->value,
		],
	))
		->setClass('CrmCreateRequisiteActivity')
		->setJsClass(ActivityDescription::DEFAULT_ACTIVITY_JS_CLASS)
		->setExcluded(!Feature::enabled(CreateRequisiteBizprocActivity::class))
		->setFilter([
			'INCLUDE' => [
				['crm', 'CCrmDocumentCompany'],
				['crm', 'CCrmDocumentContact'],
				['crm', 'CCrmDocumentDeal'],
				['crm', 'CCrmDocumentLead'],
				['crm', Quote::class],
				['crm', Invoice::class],
				['crm', Dynamic::class],
			],
			'EXCLUDE' => [
				['crm', SmartDocument::class],
				['crm', SmartB2eDocument::class],
			],
		])
		->setCategory([
			'ID' => 'document',
			'OWN_ID' => 'crm',
			'OWN_NAME' => 'CRM',
		])
		->setRobotSettings([
			'CATEGORY' => 'employee',
			'GROUP' => ['paperwork', 'payment'],
			'SORT' => 1650,
		])
		->setNodeActionSettings([
			'HANDLES_DOCUMENT' => true,
		])
		->setReturn([
			'RequisiteId' => [
				'NAME' => Loc::getMessage('CRM_CREATE_REQUISITE_ACTIVITY_RETURN_REQUISITE_ID') ?: 'Requisite ID',
				'TYPE' => FieldType::INT,
			],
			'Status' => [
				'NAME' => Loc::getMessage('CRM_CREATE_REQUISITE_ACTIVITY_RETURN_STATUS') ?: 'Status',
				'TYPE' => FieldType::SELECT,
				'OPTIONS' => [
					'created' => Loc::getMessage('CRM_CREATE_REQUISITE_ACTIVITY_STATUS_CREATED') ?: 'Created',
					'found' => Loc::getMessage('CRM_CREATE_REQUISITE_ACTIVITY_STATUS_FOUND') ?: 'Found',
					'error' => Loc::getMessage('CRM_CREATE_REQUISITE_ACTIVITY_STATUS_ERROR') ?: 'Error',
				],
			],
			'ErrorMessage' => [
				'NAME' => Loc::getMessage('CRM_CREATE_REQUISITE_ACTIVITY_RETURN_ERROR_MESSAGE') ?: 'Error message',
				'TYPE' => FieldType::STRING,
			],
		])
		->toArray()
;
