<?php

use Bitrix\Bizproc\FieldType;
use Bitrix\Bizproc\Integration\AiAssistant\Interface\IBPActivityAiDescription;
use Bitrix\Bizproc\Internal\Entity\Activity\Setting;
use Bitrix\Bizproc\Internal\Entity\Activity\SettingCollection;
use Bitrix\Bizproc\Internal\Entity\Activity\SettingOption;
use Bitrix\Bizproc\Internal\Entity\Activity\SettingOptionCollection;
use Bitrix\Crm\Category\DealCategory;
use Bitrix\Main\Loader;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

class CBPAiCrmDealStageListenActivity implements IBPActivityAiDescription
{
	public function getAiDescribedSettings(array $documentType): SettingCollection
	{
		return (new SettingCollection())
			->add(
				new Setting(
					name: 'WaitForState',
					description: 'Stage of crm deal that starts next activity',
					type: FieldType::SELECT,
					required: true,
					multiple: true,
					options: $this->getDealOptions(),
				)
			)
			->add(
				new Setting(
					name: 'DealId',
					description: 'Deal id',
					type: FieldType::INT,
					required: true,
				)
			)
		;
	}

	private function getDealOptions(): SettingOptionCollection
	{
		$options = new SettingOptionCollection();

		if (!Loader::includeModule('crm'))
		{
			return $options;
		}

		foreach (DealCategory::getStageGroupInfos() as $group)
		{
			$items = isset($group['items']) && is_array($group['items']) ? $group['items'] : array();
			$category = $group['name'] ?? DealCategory::getDefaultCategoryName();
			foreach ($items as $stageId => $stageName)
			{
				if (CCrmDeal::GetStageSemantics($stageId) === 'process')
				{
					$options->add(new SettingOption(
						id: $stageId,
						name: $stageName,
						description: "Stage only for category $category",
					));
				}
			}
		}

		return $options;
	}
}