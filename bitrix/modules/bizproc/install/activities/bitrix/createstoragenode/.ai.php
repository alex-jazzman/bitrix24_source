<?php

use Bitrix\Bizproc\FieldType;
use Bitrix\Bizproc\Integration\AiAssistant\ActivityAiPropertyConverter;
use Bitrix\Bizproc\Integration\AiAssistant\Interface\IBPActivityAiDescription;
use Bitrix\Bizproc\Internal\Entity\Activity\Setting;
use Bitrix\Bizproc\Internal\Entity\Activity\SettingCollection;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

class CBPAiCreateStorageNode extends CBPCreateStorageNode implements IBPActivityAiDescription
{
	public function __construct($name = 'createstoragenode')
	{
		parent::__construct($name);
	}

	public function getAiDescribedSettings(array $documentType): SettingCollection
	{
		$map = static::getPropertiesMap($documentType);

		// Dropped from the converted map and described below instead: of two settings sharing a name the
		// merger keeps the first one, so the converted map would shadow the curated text.
		unset($map['StorageCode']);

		return (new ActivityAiPropertyConverter())
			->convertMap($map, $documentType)
			->add(
				new Setting(
					name: 'StorageCode',
					// Every condition is worded exactly as the refusal of the agent entry words it
					// (CreateStorageNodePolicy::REASON_CODE_NOT_OWNED): one predicate must not read as two rules.
					description: 'Code of the storage. It must end with the {=Workflow:TemplateId} substitution'
						. ' placed after a non-empty prefix of up to 50 latin letters, digits and underscores that'
						. ' does not end with a digit, for example DAY_PLANNER_{=Workflow:TemplateId}: the'
						. ' substitution binds the storage to this template. The only alternative is a code the'
						. ' published template already created. Either way the code must carry no leading or'
						. ' trailing whitespace.',
					type: FieldType::STRING,
					required: true,
				)
			)
		;
	}
}
