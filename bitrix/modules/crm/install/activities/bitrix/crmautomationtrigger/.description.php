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
use Bitrix\Crm\Automation\Factory;
use Bitrix\Crm\Automation\Trigger\AppTrigger;
use Bitrix\Crm\Automation\Trigger\DocumentCreateTrigger;
use Bitrix\Crm\Automation\Trigger\DocumentViewTrigger;
use Bitrix\Crm\Automation\Trigger\FieldChangedTrigger;
use Bitrix\Crm\Automation\Trigger\PaymentTrigger;
use Bitrix\Crm\Automation\Trigger\QrTrigger;
use Bitrix\Crm\Automation\Trigger\ResourceBookingTrigger;
use Bitrix\Crm\Automation\Trigger\WebHookTrigger;
use Bitrix\Main\Loader;

$excluded = [
	FieldChangedTrigger::class,
	DocumentCreateTrigger::class,
	DocumentViewTrigger::class,
	AppTrigger::class,
	WebHookTrigger::class,
	QrTrigger::class,
	PaymentTrigger::class,
	ResourceBookingTrigger::class,
];

$presets = [];
if (Loader::includeModule('crm'))
{
	foreach (Factory::getTriggerRegistry() as $triggerClass)
	{
		if ($triggerClass::isEnabled() && !in_array($triggerClass, $excluded, true))
		{
			$presets[] = [
				'ID' => 'automation_' . $triggerClass::getCode(),
				'NAME' => $triggerClass::getNodeName(),
				'DESCRIPTION' => $triggerClass::getNodeDescription(),
				'PROPERTIES' => ['TriggerClass' => $triggerClass],
				'NODE_ICON' => $triggerClass::getNodeIcon(),
				'COLOR_INDEX' => $triggerClass::getNodeColor(),
			];
		}
	}
}

$arActivityDescription = (new ActivityDescription(
	name: '',
	description: '',
	type: [ ActivityType::TRIGGER->value ],
))
	->setClass('CrmAutomationTrigger')
	->setCategory([
		'ID' => 'document',
	])
	->setPresets($presets)
	->set('ADDITIONAL_RESULT', [ 'Return' ])
	->setGroups([ ActivityGroup::STARTER->value ])
	->setColorIndex(ActivityColorIndex::BLUE->value)
	->toArray()
;
