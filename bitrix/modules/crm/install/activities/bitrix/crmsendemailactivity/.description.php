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
	name: Loc::getMessage('CRM_SEMA_NAME'),
	description: Loc::getMessage('CRM_SEMA_DESC_1_MSG_1'),
	type: [ ActivityType::ACTIVITY->value, ActivityType::ROBOT->value, ActivityType::NODE->value ],
))
	->setCategory([
		'ID' => 'document',
		'OWN_ID' => 'crm',
		'OWN_NAME' => 'CRM',
	])
	->setClass('CrmSendEmailActivity')
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
		'CATEGORY' => 'client',
		'GROUP' => [ 'clientCommunication', 'delivery' ],
		'ASSOCIATED_TRIGGERS' => [
			'EMAIL_READ' => 1,
			'EMAIL_LINK' => 2,
			'EMAIL' => 3,
			'EMAIL_SENT' => 4,
		],
		'SORT' => 1000,
	])
	->setGroups([ ActivityGroup::CLIENT_COMMUNICATION->value ])
	->setColorIndex(ActivityColorIndex::GREEN->value)
	->setIcon(Outline::MAIL->name)
	->toArray()
;
