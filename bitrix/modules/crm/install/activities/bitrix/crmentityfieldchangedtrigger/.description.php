<?php

declare(strict_types=1);

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

$presets = [
	[
		'ID' => 'DEAL',
		'NAME' => Loc::getMessage('BP_CRM_DEAL_FCT_DESCR_NAME'),
		'DESCRIPTION' => Loc::getMessage('BP_CRM_DEAL_FCT_DESCR_DESCR'),
		'PROPERTIES' => [ 'Document' => 'DEAL' ],
		'NODE_ICON' => Outline::HANDSHAKE->name,
	],
];

if (Loader::includeModule('crm') && \CCrmSaleHelper::isWithOrdersMode())
{
	$presets[] = [
		'ID' => 'ORDER',
		'NAME' => Loc::getMessage('BP_CRM_ORDER_FCT_DESCR_NAME'),
		'DESCRIPTION' => Loc::getMessage('BP_CRM_ORDER_FCT_DESCR_DESCR'),
		'PROPERTIES' => [ 'Document' => 'ORDER' ],
		'NODE_ICON' => Outline::CHANGE_ORDER->name,
	];
}

$arActivityDescription = (new ActivityDescription(
	name: '',
	description: '',
	type: [ ActivityType::TRIGGER->value ],
))
	->setClass('CrmEntityFieldChangedTrigger')
	->setCategory([
		'ID' => 'document',
	])
	->setPresets($presets)
	->set('ADDITIONAL_RESULT', [ 'Return' ])
	->setGroups([ ActivityGroup::STARTER->value ])
	->setColorIndex(ActivityColorIndex::BLUE->value)
	->toArray()
;
