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
	name: Loc::getMessage('SNBPA_DESCR_NAME_2_MSGVER_1'),
	description: Loc::getMessage('SNBPA_DESCR_DESCR_1'),
	type: [ ActivityType::ACTIVITY->value, ActivityType::ROBOT->value, ActivityType::NODE->value ],
))
	->setCategory([
		'ID' => 'interaction',
	])
	->setClass('SocnetBlogPostActivity')
	->setJsClass('BizProcActivity')
	->setReturn([
		'PostId' => [
			'NAME' => Loc::getMessage('SNBPA_RETURN_POST_ID'),
			'TYPE' => 'int',
		],
		'PostUrl' => [
			'NAME' => Loc::getMessage('SNBPA_RETURN_POST_URL'),
			'TYPE' => 'string',
		],
		'PostUrlBb' => [
			'NAME' => Loc::getMessage('SNBPA_RETURN_POST_URL_BB'),
			'TYPE' => 'string',
		],
	])
	->setRobotSettings([
		'CATEGORY' => 'employee',
		'RESPONSIBLE_PROPERTY' => 'UsersTo',
		'GROUP' => [ 'informingEmployee' ],
		'SORT' => 900,
	])
	->setGroups([ ActivityGroup::INTERNAL_COMMUNICATION->value ])
	->setColorIndex(ActivityColorIndex::BLUE->value)
	->setIcon(Outline::NEWSFEED->name)
	->toArray()
;
