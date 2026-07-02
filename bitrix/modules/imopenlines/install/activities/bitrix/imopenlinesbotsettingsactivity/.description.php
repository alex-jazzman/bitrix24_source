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
use Bitrix\Bizproc\FieldType;
use Bitrix\ImOpenLines\V2\Feature\AiOpenLinesOperatorAgentFeature;
use Bitrix\Main\DI\ServiceLocator;
use Bitrix\Main\Loader;
use Bitrix\Main\Localization\Loc;
use Bitrix\Ui\Public\Enum\IconSet\Outline;

if (
	!Loader::includeModule('imopenlines')
	|| !ServiceLocator::getInstance()->get(AiOpenLinesOperatorAgentFeature::class)?->isAvailable()
)
{
	return;
}

$arActivityDescription = (new ActivityDescription(
	name: Loc::getMessage('IMOL_BOT_SETTINGS_ACTIVITY_NAME'),
	description: Loc::getMessage('IMOL_BOT_SETTINGS_ACTIVITY_DESCRIPTION'),
	type: [
		ActivityType::NODE->value,
	],
))
	->setClass('ImOpenLinesBotSettingsActivity')
	->setJsClass('BizProcActivity')
	->setReturn([
		'botId' => [
			'NAME' => Loc::getMessage('IMOL_BOT_SETTINGS_ACTIVITY_RETURN_BOT_ID_NAME'),
			'TYPE' => FieldType::INT,
		],
		'errors' => [
			'NAME' => Loc::getMessage('IMOL_BOT_SETTINGS_ACTIVITY_RETURN_ERRORS_NAME'),
			'TYPE' => FieldType::STRING,
		],
		'successQueueConnectedList' => [
			'NAME' => Loc::getMessage('IMOL_BOT_SETTINGS_ACTIVITY_RETURN_SUCCESS_QUEUE_CONNECTED_NAME'),
			'TYPE' => FieldType::STRING,
		],
	])
	->setExcluded(
		!Loader::includeModule('imopenlines')
		|| !Loader::includeModule('imbot')
		|| !Loader::includeModule('im')
		|| !ServiceLocator::getInstance()->get(AiOpenLinesOperatorAgentFeature::class)?->isAvailable()
	)
	->setGroups([
		ActivityGroup::CLIENT_COMMUNICATION->value,
	])
	->setColorIndex(ActivityColorIndex::GREEN->value)
	->setIcon(Outline::MESSENGER->name)
	->toArray()
;
