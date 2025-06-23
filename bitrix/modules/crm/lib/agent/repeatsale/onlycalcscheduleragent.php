<?php

namespace Bitrix\Crm\Agent\RepeatSale;

use Bitrix\Crm\Agent\AgentBase;
use Bitrix\Crm\RepeatSale\Schedule\Scheduler;

class OnlyCalcSchedulerAgent extends AgentBase
{
	public const AGENT_DONE_STOP_IT = false;

	public static function doRun(): bool
	{
		Scheduler::getInstance()->setOnlyCalc()->execute();

		return self::AGENT_DONE_STOP_IT;
	}
}
