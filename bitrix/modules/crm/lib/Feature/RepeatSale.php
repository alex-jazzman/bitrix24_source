<?php

namespace Bitrix\Crm\Feature;

use Bitrix\Crm\Feature\Category\BaseCategory;
use Bitrix\Crm\Feature\Category\Common;
use Bitrix\Main\Localization\Loc;

class RepeatSale extends BaseFeature
{
	public function getName(): string
	{
		return Loc::getMessage('CRM_FEATURE_REPEAT_SALE_NAME');
	}

	public function getCategory(): BaseCategory
	{
		return Common::getInstance();
	}

	protected function getOptionName(): string
	{
		return 'CRM_REPEAT_SALE';
	}

	protected function getEnabledValue(): bool
	{
		return true;
	}

	public function enable(): void
	{
		if ($this->isEnabled())
		{
			return;
		}

		parent::enable();

		$jobExecutorAgentName = 'Bitrix\Crm\Agent\RepeatSale\JobExecutorAgent::run();';
		if (\CAgent::GetList(null, ['NAME' => $jobExecutorAgentName, 'MODULE_ID' => 'crm'])->Fetch())
		{
			return;
		}

		/**
		 * @see \Bitrix\Crm\Agent\RepeatSale\OnlyCalcSchedulerAgent
		 */
		\CAgent::AddAgent(
			'Bitrix\Crm\Agent\RepeatSale\OnlyCalcSchedulerAgent::run();',
			'crm',
			'N',
			3600,
			'',
			'Y',
			\ConvertTimeStamp(time() + \CTimeZone::GetOffset() + 700, 'FULL'),
		);

		/**
		 * @see \Bitrix\Crm\Agent\RepeatSale\JobExecutorAgent
		 */
		\CAgent::AddAgent(
			$jobExecutorAgentName,
			'crm',
			'N',
			60,
			'',
			'Y',
			\ConvertTimeStamp(time() + \CTimeZone::GetOffset() + 800, 'FULL'),
		);
	}
}