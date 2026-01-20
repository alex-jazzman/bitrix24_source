<?php

use Bitrix\Bizproc\Integration\AiAssistant\ActivityAiPropertyConverter;
use Bitrix\Bizproc\Integration\AiAssistant\Interface\IBPActivityAiDescription;
use Bitrix\Bizproc\Internal\Entity\Activity\Setting;
use Bitrix\Bizproc\Internal\Entity\Activity\SettingCollection;
use Bitrix\Main\Loader;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

class CBPAiCreateCrmCompanyDocumentActivity implements IBPActivityAiDescription
{
	public function getAiDescribedSettings(array $documentType): SettingCollection
	{
		return (new SettingCollection())
			->add(
				new Setting(
					name: 'Fields',
					description: 'Object, property names are identifiers of CRM Company document type fields and property values would set for fields',
					type: ActivityAiPropertyConverter::SETTING_TYPE_MAP,
					required: true,
					children: $this->getFieldsSettings(),
				)
			)
		;
	}

	protected function getFieldsSettings(): ?SettingCollection
	{
		if (!Loader::includeModule('crm'))
		{
			return null;
		}

		$documentType = \CCrmBizProcHelper::ResolveDocumentType(\CCrmOwnerType::Company);

		return \CBPRuntime::GetRuntime()
			->getAiDescriptionService()
			->getEditableDocumentFieldSettings($documentType)
		;
	}
}