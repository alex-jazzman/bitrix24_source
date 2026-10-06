<?php

declare(strict_types=1);

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Bizproc\Activity\ActivityDescription;
use Bitrix\Bizproc\Activity\Enum\ActivityColorIndex;
use Bitrix\Bizproc\Activity\Enum\ActivityContentBlockColor;
use Bitrix\Bizproc\Activity\Enum\ActivityGroup;
use Bitrix\Bizproc\Activity\Enum\ActivityNodeType;
use Bitrix\Bizproc\Activity\Enum\ActivityType;
use Bitrix\Bizproc\Public\Service\AiAgent\NodeAvailabilityServiceInterface;
use Bitrix\Main\DI\ServiceLocator;
use Bitrix\Main\Loader;
use Bitrix\Main\Localization\Loc;
use Bitrix\Ui\Public\Enum\IconSet\Outline;

$serviceLocator = ServiceLocator::getInstance();
$isAiNodeAvailable =
	$serviceLocator->has(NodeAvailabilityServiceInterface::class)
	&& $serviceLocator->get(NodeAvailabilityServiceInterface::class)->isAvailable()
;

$activityDescription =
	(new ActivityDescription(
		Loc::getMessage('AI_ACTIVITY_PROCESSING_NAME_MSGVER_2') ?? '',
		Loc::getMessage('AI_ACTIVITY_PROCESSING_DESC') ?? '',
		[ ActivityType::NODE->value ],
	))
	->setClass('AiProcessingActivity')
	->setJsClass('BizProcActivity')
	->setExcluded(!Loader::includeModule('ai') || !$isAiNodeAvailable)
	->setReturn([
		'aiResult' => [
			'NAME' => Loc::getMessage('AI_ACTIVITY_PROCESSING_AI_RESULT'),
			'TYPE' => 'string',
		],
		'errorMessage' => [
			'NAME' => Loc::getMessage('AI_ACTIVITY_PROCESSING_RETURN_ERROR_MESSAGE'),
			'TYPE' => 'string',
		],
	])
	->setAdditionalResult(['jsonPath'])
	->setGroups([ ActivityGroup::AI->value ])
	->setColorIndex(ActivityColorIndex::PINK->value)
	->setIcon(Outline::AI_ROBOT->name)
;

if (class_exists(ActivityNodeType::class) && defined(ActivityNodeType::class . '::SERVICE'))
{
	$activityDescription->setNodeType(ActivityNodeType::SERVICE->value);
}

if (method_exists(ActivityDescription::class, 'setContentBlockColor') && class_exists(ActivityContentBlockColor::class))
{
	$activityDescription->setContentBlockColor(ActivityContentBlockColor::DEFAULT->value);
}

$arActivityDescription = $activityDescription->toArray();
