<?php

declare(strict_types=1);

namespace Bitrix\Tasks\V2\Controller;

use Bitrix\Tasks\V2\Entity;
use Bitrix\Tasks\V2\Internals\Repository\UserRepositoryInterface;

class User extends BaseController
{
	/**
	 * @ajaxAction tasks.V2.User.list
	 */
	#[Prefilter\CloseSession]
	public function listAction(
		array $ids,
		UserRepositoryInterface $userRepository,
	): Entity\UserCollection
	{
		return $userRepository->getByIds($ids);
	}
}
