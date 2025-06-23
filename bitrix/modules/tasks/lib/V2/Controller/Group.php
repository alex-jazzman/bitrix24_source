<?php

declare(strict_types=1);

namespace Bitrix\Tasks\V2\Controller;

use Bitrix\Tasks\Integration\SocialNetwork\Collab\Url\UrlManager;
use Bitrix\Tasks\V2\Access\Group\Permission;
use Bitrix\Tasks\V2\Entity;
use Bitrix\Tasks\V2\Internals\Repository\GroupRepositoryInterface;

class Group extends BaseController
{
	/**
	 * @ajaxAction tasks.V2.Group.getUrl
	 */
	#[Prefilter\CloseSession]
	public function getUrlAction(int $id, ?string $type = null): string
	{
		return UrlManager::getUrlByType($id, $type);
	}

	/**
	 * @ajaxAction tasks.V2.Group.get
	 */
	#[Prefilter\CloseSession]
	public function getAction(
		#[Permission\Read] Entity\Group $group,
		GroupRepositoryInterface $groupRepository,
	): ?Entity\Group
	{
		return $groupRepository->getById($group->getId());
	}
}
