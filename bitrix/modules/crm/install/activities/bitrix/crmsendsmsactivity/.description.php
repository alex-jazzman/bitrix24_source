<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Bizproc\Activity\ActivityDescription;
use Bitrix\Bizproc\Activity\Enum\ActivityColorIndex;
use Bitrix\Bizproc\Activity\Enum\ActivityGroup;
use Bitrix\Bizproc\Activity\Enum\ActivityType;
use Bitrix\Main\Localization\Loc;
use Bitrix\Ui\Public\Enum\IconSet\Outline;

$arActivityDescription = (new ActivityDescription(
	name: Loc::getMessage('CRM_SSMSA_NAME'),
	description: Loc::getMessage('CRM_SSMSA_DESC'),
	type: [ ActivityType::ACTIVITY->value, ActivityType::ROBOT->value ],
))
	->setCategory([
		'ID' => 'document',
		'OWN_ID' => 'crm',
		'OWN_NAME' => 'CRM',
	])
	->setClass('CrmSendSmsActivity')
	->setJsClass('BizProcActivity')
	->setFilter([
		'INCLUDE' => [
			[ 'crm', 'CCrmDocumentLead' ],
			[ 'crm', 'CCrmDocumentDeal' ],
			[ 'crm', 'CCrmDocumentContact' ],
			[ 'crm', 'CCrmDocumentCompany' ],
			[ 'crm', 'Bitrix\Crm\Integration\BizProc\Document\Order' ],
			[ 'crm', 'Bitrix\Crm\Integration\BizProc\Document\Dynamic' ],
			[ 'crm', 'Bitrix\Crm\Integration\BizProc\Document\Quote' ],
			[ 'crm', 'Bitrix\Crm\Integration\BizProc\Document\SmartInvoice' ],
			[ 'crm', \Bitrix\Crm\Integration\BizProc\Document\SmartDocument::class ],
		],
	])
	->setRobotSettings([
		'CATEGORY' => [ 'employee', 'client' ],
		'TITLE_CATEGORY' => [
			'employee' => Loc::getMessage('CRM_SSMSA_ROBOT_TITLE_EMPLOYEE_1'),
			'client' => Loc::getMessage('CRM_SSMSA_ROBOT_TITLE_CLIENT_1'),
		],
		'DESCRIPTION_CATEGORY' => [
			'employee' => Loc::getMessage('CRM_SSMA_ROBOT_DESCRIPTION_EMPLOYEE'),
			'client' => Loc::getMessage('CRM_SSMA_ROBOT_DESCRIPTION_CLIENT'),
		],
		'GROUP' => [ 'clientCommunication', 'informingEmployee', 'delivery' ],
		'TITLE_GROUP' => [
			'clientCommunication' => Loc::getMessage('CRM_SSMSA_ROBOT_TITLE_CLIENT_1'),
			'informingEmployee' => Loc::getMessage('CRM_SSMSA_ROBOT_TITLE_EMPLOYEE_1'),
			'delivery' => Loc::getMessage('CRM_SSMSA_ROBOT_TITLE_CLIENT_1'),
		],
		'DESCRIPTION_GROUP' => [
			'clientCommunication' => Loc::getMessage('CRM_SSMA_ROBOT_DESCRIPTION_CLIENT'),
			'informingEmployee' => Loc::getMessage('CRM_SSMA_ROBOT_DESCRIPTION_EMPLOYEE'),
			'delivery' => Loc::getMessage('CRM_SSMA_ROBOT_DESCRIPTION_CLIENT'),
		],
		'SORT' => 1300,
	])
	->setGroups([ ActivityGroup::CLIENT_COMMUNICATION->value ])
	->setColorIndex(ActivityColorIndex::GREEN->value)
	->setIcon(Outline::SMS->name)
	->toArray()
;
