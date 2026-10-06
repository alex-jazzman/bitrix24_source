<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Bizproc\Activity\ActivityDescription;
use Bitrix\Bizproc\Activity\Dto\NodePorts;
use Bitrix\Bizproc\Activity\Dto\NodeSettings;
use Bitrix\Bizproc\Activity\Dto\Port;
use Bitrix\Bizproc\Activity\Dto\PortCollection;
use Bitrix\Bizproc\Activity\Enum\ActivityColorIndex;
use Bitrix\Bizproc\Activity\Enum\ActivityGroup;
use Bitrix\Bizproc\Activity\Enum\ActivityType;
use Bitrix\Bizproc\Activity\Enum\ActivityNodeType;
use Bitrix\Main\Localization\Loc;
use Bitrix\Ui\Public\Enum\IconSet\Outline;

$type = [ActivityType::ACTIVITY->value];
if (defined('Bitrix\Bizproc\Dev\ENV'))
{
	$type[] = ActivityType::NODE->value;
}

$arActivityDescription = (new ActivityDescription(
	name: Loc::GetMessage('BPHEEA_DESCR_NAME_MSGVER_1'),
	description: Loc::GetMessage('BPHEEA_DESCR_DESCR_MSGVER_1'),
	type: $type,
))
	->setClass('HandleExternalEventActivity')
	->setJsClass('HandleExternalEventActivity')
	->setCategory([
		'ID' => 'logic',
	])
	->setReturn([
		'SenderUserId' => [
			'NAME' => Loc::getMessage('BPAA_DESCR_SENDER_USER_ID_MSGVER_1'),
			'TYPE' => 'user',
		],
	])
	->setGroups([ ActivityGroup::WORKFLOW->value, ActivityGroup::WORKFLOW_STATE->value ])
	->setColorIndex(ActivityColorIndex::GREY->value)
	->setIcon(Outline::ACTION_REQUIRED->name)
	->toArray()
;
