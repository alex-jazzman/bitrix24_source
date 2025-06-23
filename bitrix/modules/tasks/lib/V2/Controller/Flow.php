<?php

declare(strict_types=1);

namespace Bitrix\Tasks\V2\Controller;

use Bitrix\Tasks\V2\Access\Flow\Permission;
use Bitrix\Tasks\V2\Entity;
use Bitrix\Tasks\V2\Internals\Repository\FlowRepositoryInterface;
use Bitrix\Tasks\V2\Internals\Repository\GroupRepositoryInterface;

class Flow extends BaseController
{
	/**
	 * @ajaxAction tasks.V2.Flow.get
	 */
	#[Prefilter\CloseSession]
	public function getAction(
		#[Permission\Read] Entity\Flow $flow,
		FlowRepositoryInterface $flowRepository,
		GroupRepositoryInterface $groupRepository,
	): ?Entity\Flow
	{
		$flow = $flowRepository->getById($flow->getId());
		if ($flow === null || $flow->group === null)
		{
			return null;
		}

		$group = $groupRepository->getById($flow->group->getId());
		if ($group === null)
		{
			return $flow;
		}

		return $flow->cloneWith(['group' => $group->toArray()]);
	}
}
