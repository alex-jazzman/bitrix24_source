<?php

declare(strict_types=1);

namespace Bitrix\Tasks\V2\Controller\Group;

use Bitrix\Tasks\V2\Controller\BaseController;
use Bitrix\Tasks\V2\Entity;
use Bitrix\Tasks\V2\Access\Group\Permission;
use Bitrix\Tasks\V2\Internals\Repository\StageRepositoryInterface;
use Bitrix\Tasks\V2\Controller\Prefilter;

class Stage extends BaseController
{
	/**
	 * @ajaxAction tasks.V2.Group.Stage.list
	 */
	#[Prefilter\CloseSession]
	public function listAction(
		#[Permission\Read] Entity\Group $group,
		StageRepositoryInterface $stageRepository
	): ?Entity\StageCollection
	{
		return $stageRepository->getByGroupId($group->getId());
	}
}
