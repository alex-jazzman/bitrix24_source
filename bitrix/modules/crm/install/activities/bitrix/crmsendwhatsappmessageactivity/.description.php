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

$filter = [ 'MIN_API_VERSION' => 1, 'INCLUDE' => [ [ 'crm' ] ] ];
$excluded = false;

if (
	!defined('CBPRuntime::ACTIVITY_API_VERSION')
	|| !\Bitrix\Main\Loader::includeModule('messageservice')
	|| !\Bitrix\MessageService\Sender\Sms\Ednaru::isSupported()
)
{
	$filter = [];
	$excluded = true;
}

$arActivityDescription = (new ActivityDescription(
	name: Loc::getMessage('CRM_SEND_EDNA_WHATS_APP_MESSAGE_ACTIVITY_DESCRIPTION_NAME'),
	description: Loc::getMessage('CRM_SEND_EDNA_WHATS_APP_MESSAGE_ACTIVITY_DESCRIPTION_DESCRIPTION'),
	type: [ ActivityType::ACTIVITY->value, ActivityType::ROBOT->value ],
))
	->setCategory([
		'ID' => 'document',
		'OWN_ID' => 'crm',
		'OWN_NAME' => 'CRM',
	])
	->setClass('CrmSendWhatsAppMessageActivity')
	->setJsClass('BizProcActivity')
	->setFilter($filter)
	->setExcluded($excluded)
	->setRobotSettings([
		'CATEGORY' => 'client',
		'GROUP' => [ 'clientCommunication' ],
		'SORT' => 1349,
	])
	->setGroups([ ActivityGroup::CLIENT_COMMUNICATION->value ])
	->setColorIndex(ActivityColorIndex::GREEN->value)
	->setIcon(Outline::WHATSAPP->name)
	->toArray()
;
