<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Bizproc\Activity\ActivityDescription;
use Bitrix\Bizproc\Activity\Enum\ActivityColorIndex;
use Bitrix\Bizproc\Activity\Enum\ActivityGroup;
use Bitrix\Bizproc\Activity\Enum\ActivityType;
use Bitrix\Main\Loader;
use Bitrix\Main\Localization\Loc;
use Bitrix\Ui\Public\Enum\IconSet\Outline;

$arActivityDescription = (new ActivityDescription(
	name: Loc::getMessage('IMBOT_MESSAGE_ACTIVITY_DESCRIPTION_NAME'),
	description: Loc::getMessage('IMBOT_MESSAGE_ACTIVITY_DESCRIPTION_DESCRIPTION'),
	type: [ ActivityType::NODE->value ],
))
	->setCategory([
		'ID' => 'interaction',
	])
	->setClass('ImBotMessageActivity')
	->setJsClass('BizProcActivity')
	->setExcluded(!Loader::includeModule('imbot'))
	->setGroups([ ActivityGroup::INTERNAL_COMMUNICATION->value ])
	->setColorIndex(ActivityColorIndex::ORANGE->value)
	->setIcon(Outline::GO_TO_MESSAGE->name)
	->toArray()
;
