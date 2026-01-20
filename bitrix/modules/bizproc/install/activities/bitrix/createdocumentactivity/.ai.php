<?php

use Bitrix\Bizproc\Integration\AiAssistant\ActivityAiPropertyConverter;
use Bitrix\Bizproc\Integration\AiAssistant\Interface\IBPActivityAiDescription;
use Bitrix\Bizproc\Internal\Entity\Activity\Setting;
use Bitrix\Bizproc\Internal\Entity\Activity\SettingCollection;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

class CBPAiCreateDocumentActivity implements IBPActivityAiDescription
{
	public function getAiDescribedSettings(array $documentType): SettingCollection
	{
		return (new SettingCollection())
			->add(
				new Setting(
					name: 'Fields',
					description: 'Object, property names are identifiers of current document type fields and property values would set for fields',
					type: ActivityAiPropertyConverter::SETTING_TYPE_MAP,
					required: true,
					children: \CBPRuntime::GetRuntime()
						->getAiDescriptionService()
						->getEditableDocumentFieldSettings($documentType)
					,
				)
			)
		;
	}
}