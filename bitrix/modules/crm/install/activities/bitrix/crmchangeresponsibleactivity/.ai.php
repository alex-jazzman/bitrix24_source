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

class CBPAiCrmChangeResponsibleActivity extends CBPCrmChangeResponsibleActivity implements IBPActivityAiDescription
{
	public function __construct($name = 'crmchangeresponsibleactivity')
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
		;
	}
}
