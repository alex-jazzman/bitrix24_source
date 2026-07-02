<?php

declare(strict_types=1);

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) {
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

$arActivityDescription = (new ActivityDescription(
	name: Loc::getMessage('CRM_CLIENT_SUMMARY_ACTIVITY_NAME'),
	description: Loc::getMessage('CRM_CLIENT_SUMMARY_ACTIVITY_DESCRIPTION'),
	type: [
		ActivityType::NODE->value,
	],
))
	->setClass('CrmClientSummaryActivity')
	->setJsClass('BizProcActivity')
	->setExcluded(
		!Loader::includeModule('crm')
		|| !Loader::includeModule('imopenlines')
		|| !class_exists(AiOpenLinesOperatorAgentFeature::class)
		|| !ServiceLocator::getInstance()->get(AiOpenLinesOperatorAgentFeature::class)?->isAvailable()
	)
	->setGroups([
		ActivityGroup::SALES_CRM->value,
	])
	->setReturn([
		'summaryJson' => [
			'NAME' => Loc::getMessage('CRM_CLIENT_SUMMARY_ACTIVITY_RETURN_SUMMARY_JSON_NAME'),
			'TYPE' => FieldType::JSON,
		],
	])
	->setColorIndex(ActivityColorIndex::BLUE->value)
	->setIcon(Outline::CONTACT->name)
	->toArray()
;
