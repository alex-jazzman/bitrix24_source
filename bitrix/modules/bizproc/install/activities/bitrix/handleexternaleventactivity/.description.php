<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Bizproc\Activity\ActivityDescription;
use Bitrix\Bizproc\Activity\Enum\ActivityType;
use Bitrix\Main\Localization\Loc;

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
	->toArray()
;
