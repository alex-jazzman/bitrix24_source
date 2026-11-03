<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Bizproc\Activity\ActivityDescription;
use Bitrix\Bizproc\Activity\Enum\ActionArea;
use Bitrix\Bizproc\Activity\Enum\ActionGroup;
use Bitrix\Bizproc\Activity\Enum\ActivityColorIndex;
use Bitrix\Bizproc\Activity\Enum\ActivityGroup;
use Bitrix\Bizproc\Activity\Enum\ActivityType;
use Bitrix\Main\Localization\Loc;
use Bitrix\Ui\Public\Enum\IconSet\Outline;

$description = (new ActivityDescription(
	name: Loc::getMessage('BPIMNA_DESCR_NAME'),
	description: Loc::getMessage('BPIMNA_DESCR_DESCR'),
	type: [ ActivityType::ACTIVITY->value, ActivityType::NODE->value, ActivityType::NODE_ACTION->value ],
))
	->setCategory([
		'ID' => 'interaction',
	])
	->setClass('IMNotifyActivity')
	->setJsClass('BizProcActivity')
	->setGroups([ ActivityGroup::INTERNAL_COMMUNICATION->value ])
	->setColorIndex(ActivityColorIndex::ORANGE->value)
	->setIcon(Outline::NOTIFICATION->name)
;

if (
	enum_exists('\Bitrix\Bizproc\Activity\Enum\ActionGroup')
	&& enum_exists('\Bitrix\Bizproc\Activity\Enum\ActionArea')
)
{
	$description->setNodeActionSettings([
		'HANDLES_DOCUMENT' => false,
		'ACTION_GROUP' => ActionGroup::SEND->value,
		'ACTION_AREA' => ActionArea::MESSENGER->value,
	]);
}

$arActivityDescription = $description->toArray();
