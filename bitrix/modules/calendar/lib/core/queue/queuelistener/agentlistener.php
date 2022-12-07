<?php

namespace Bitrix\Calendar\Core\Queue\QueueListener;

use Bitrix\Calendar\Core\Queue\Agent\AgentEntity;
use Bitrix;
use Bitrix\Calendar\Core\Queue;
use CAgent;

class AgentListener implements Queue\Interfaces\Listener
{
	private AgentEntity $agentEntity;

	public function __construct(AgentEntity $agentEntity)
	{
		$this->agentEntity = $agentEntity;
	}

	/**
	 * @return void
	 */
	public function handle()
	{
		if ($agentId = $this->getAgentId())
		{
			$time = new Bitrix\Main\Type\DateTime();
			if ($this->agentEntity->getDelay())
			{
				$time->add($this->agentEntity->getDelay() . ' seconds');
			}
			CAgent::Update($agentId,[
				'NEXT_EXEC' => $time,
			]);
		}
	}

	/**
	 * @return int|null
	 */
	private function getAgentId(): ?int
	{
		$agent = CAgent::getList(
			[],
			[
				'MODULE_ID' => $this->agentEntity->getModule(),
				'=NAME' => $this->agentEntity->getName(),
			]
		)->Fetch();

		if ($agent)
		{
			return $agent['ID'];
		}

		return null;
	}
}