<?php

declare(strict_types=1);

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Bizproc\Activity\ActivityDescription;
use Bitrix\Bizproc\Activity\Enum\ActivityColorIndex;
use Bitrix\Bizproc\Activity\Enum\ActivityType;
use Bitrix\Bizproc\FieldType;
use Bitrix\Main\Localization\Loc;
use Bitrix\Ui\Public\Enum\IconSet\Outline;

if (\CBPRuntime::ACTIVITY_API_VERSION < 3)
{
	return;
}

// The activity ships lang/ru only, so on a portal whose default language is not ru the phrases resolve to
// null and the name would come out empty - which AgentBlockValidator rejects for every saved node of this
// type. Fall back to the shipped ru phrase; the translations replace it as soon as they arrive.
$phrase = static fn(string $code): string => Loc::getMessage($code) ?: (Loc::getMessage($code, null, 'ru') ?? '');

// Not offered as a new block: no presets, hence no palette cards, and DEPRECATED so the AI block catalogs
// drop it too. The "any change" mode is reached through the reaction-mode selector of the field-changed
// trigger and through legacy template conversion instead. EXCLUDED is not interchangeable: the block
// validator and the metadata resolver of saved nodes read it and would stop resolving templates that
// already hold such a node; DEPRECATED they ignore. The runtime presets of the class stay untouched - the
// converter resolves this descriptor by document type through them.
$arActivityDescription = (new ActivityDescription(
	name: $phrase('BP_CRM_ENTITY_EDIT_TRIGGER_NAME'),
	description: $phrase('BP_CRM_ENTITY_EDIT_TRIGGER_DESCR'),
	type: [ActivityType::TRIGGER->value],
))
	->setClass('CrmEntityEditTrigger')
	->setCategory(['ID' => 'document'])
	->setDeprecated(true)
	->setIcon(Outline::DOCUMENT_UPDATE->name)
	->setReturn([
		'Initiator' => [
			'Name' => $phrase('BP_CRM_ENTITY_EDIT_TRIGGER_RETURN_INITIATOR'),
			'Type' => FieldType::USER,
			'Default' => null,
		],
		'EventDateTime' => [
			'Name' => $phrase('BP_CRM_ENTITY_EDIT_TRIGGER_RETURN_EVENT_DATE_TIME'),
			'Type' => FieldType::DATETIME,
			'Default' => null,
		],
	])
	->set('ADDITIONAL_RESULT', ['Return'])
	->setColorIndex(ActivityColorIndex::BLUE->value)
	->toArray()
;
