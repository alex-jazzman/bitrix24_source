<?php

use Bitrix\Bizproc\Integration\AiAssistant\ActivityAiPropertyConverter;
use Bitrix\Bizproc\Integration\AiAssistant\Interface\IBPActivityAiDescription;
use Bitrix\Bizproc\Internal\Entity\Activity\Setting;
use Bitrix\Bizproc\Internal\Entity\Activity\SettingCollection;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}
class CBPAiSetFieldActivity extends CBPSetFieldActivity implements IBPActivityAiDescription
{
	public function __construct($name = 'setfieldactivity')
	{
		parent::__construct($name);
	}

	public function getAiDescribedSettings(array $documentType): SettingCollection
	{
		return (new ActivityAiPropertyConverter())
			->convertMap(static::getPropertiesMap($documentType), $documentType)
			->add(
				new Setting(
					name: 'ModifiedBy',
					description: 'User who is owner of changes',
					type: \Bitrix\Bizproc\BaseType\User::getAiSettingType(),
				)
			)
			->add(
				new Setting(
					name: 'FieldValue',
					description: 'Object, property names are identifiers of editable document fields and property values would set for fields',
					type: ActivityAiPropertyConverter::SETTING_TYPE_MAP,
					required: true,
					children: $this->getEditableFieldWithoutRequired($documentType),
				)
			)
		;
	}

	protected function getEditableFieldWithoutRequired(array $documentType): SettingCollection
	{
		$settingsWithRequired = \CBPRuntime::GetRuntime()
			->getAiDescriptionService()
			->getEditableDocumentFieldSettings($documentType)
		;

		$settingsWithoutRequired = new SettingCollection();
		foreach ($settingsWithRequired as $setting)
		{
			if ($setting instanceof Setting)
			{
				$settingsWithoutRequired->add(
					new Setting(
						name: $setting->name,
						description: $setting->description,
						type: $setting->type,
						required: false,
						multiple: $setting->multiple,
						options: $setting->options,
					)
				);
			}
		}

		return $settingsWithoutRequired;
	}
}