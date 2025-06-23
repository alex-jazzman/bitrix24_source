<?php

namespace Bitrix\Crm\Agent\RepeatSale;

use Bitrix\Crm\Agent\AgentBase;
use Bitrix\Crm\RepeatSale\Queue\Executor;

class JobExecutorAgent extends AgentBase
{
	public const PERIODICAL_AGENT_RUN_LATER = true;

	public static function doRun(): bool
	{
		Executor::getInstance()->execute();

		return self::PERIODICAL_AGENT_RUN_LATER;
	}
}
