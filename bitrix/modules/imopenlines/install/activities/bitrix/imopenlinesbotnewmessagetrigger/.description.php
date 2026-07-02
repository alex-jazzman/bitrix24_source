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
	name: Loc::getMessage('IMOL_BOT_NEW_MESSAGE_TRIGGER_NAME'),
	description: Loc::getMessage('IMOL_BOT_NEW_MESSAGE_TRIGGER_DESCRIPTION'),
	type: [
		ActivityType::TRIGGER->value,
	],
))
	->setClass('ImOpenLinesBotNewMessageTrigger')
	->setJsClass('BizProcActivity')
	->setExcluded(
		!Loader::includeModule('imopenlines')
		|| !Loader::includeModule('imbot')
		|| !Loader::includeModule('im')
		|| !ServiceLocator::getInstance()->get(AiOpenLinesOperatorAgentFeature::class)?->isAvailable()
	)
	->setReturn([
		'message' => [
			'NAME' => Loc::getMessage('IMOL_BOT_NEW_MESSAGE_TRIGGER_RETURN_MESSAGE_NAME'),
			'TYPE' => FieldType::STRING,
		],
		'chatId' => [
			'NAME' => Loc::getMessage('IMOL_BOT_NEW_MESSAGE_TRIGGER_RETURN_CHAT_ID_NAME'),
			'TYPE' => FieldType::STRING,
		],
		'actualBotId' => [
			'NAME' => Loc::getMessage('IMOL_BOT_NEW_MESSAGE_TRIGGER_RETURN_ACTUAL_BOT_ID_NAME'),
			'TYPE' => FieldType::INT,
		],
		'fromUserId' => [
			'NAME' => Loc::getMessage('IMOL_BOT_NEW_MESSAGE_TRIGGER_RETURN_FROM_USER_ID_NAME'),
			'TYPE' => FieldType::STRING,
		],
		'crmAssociatedItem' => [
			'NAME' => Loc::getMessage('IMOL_BOT_NEW_MESSAGE_TRIGGER_RETURN_CRM_ASSOCIATED_ITEM_NAME'),
			'TYPE' => FieldType::DOCUMENT,
		],
		'crmAssociatedClient' => [
			'NAME' => Loc::getMessage('IMOL_BOT_NEW_MESSAGE_TRIGGER_RETURN_CRM_ASSOCIATED_CLIENT_NAME'),
			'TYPE' => FieldType::DOCUMENT,
		],
		'crmActivityId' => [
			'NAME' => Loc::getMessage('IMOL_BOT_NEW_MESSAGE_TRIGGER_RETURN_CRM_ACTIVITY_ID_NAME'),
			'TYPE' => FieldType::INT,
		],
		'crmAssociatedItemEntityTypeId' => [
			'NAME' => Loc::getMessage('IMOL_BOT_NEW_MESSAGE_TRIGGER_RETURN_CRM_ASSOCIATED_ITEM_ENTITY_TYPE_ID_NAME'),
			'TYPE' => FieldType::INT,
		],
		'crmAssociatedItemId' => [
			'NAME' => Loc::getMessage('IMOL_BOT_NEW_MESSAGE_TRIGGER_RETURN_CRM_ASSOCIATED_ITEM_ID_NAME'),
			'TYPE' => FieldType::INT,
		],
		'crmAssociatedClientEntityTypeId' => [
			'NAME' => Loc::getMessage('IMOL_BOT_NEW_MESSAGE_TRIGGER_RETURN_CRM_ASSOCIATED_CLIENT_ENTITY_TYPE_ID_NAME'),
			'TYPE' => FieldType::INT,
		],
		'crmAssociatedClientId' => [
			'NAME' => Loc::getMessage('IMOL_BOT_NEW_MESSAGE_TRIGGER_RETURN_CRM_ASSOCIATED_CLIENT_ID_NAME'),
			'TYPE' => FieldType::INT,
		],
		'isFirstMessage' => [
			'NAME' => Loc::getMessage('IMOL_BOT_NEW_MESSAGE_TRIGGER_RETURN_IS_FIRST_MESSAGE_NAME'),
			'TYPE' => FieldType::BOOL,
		],
	])
	->setGroups([
		ActivityGroup::CLIENT_COMMUNICATION->value,
		ActivityGroup::STARTER->value,
	])
	->setColorIndex(ActivityColorIndex::GREEN->value)
	->setIcon(Outline::MESSAGE->name)
	->toArray()
;
