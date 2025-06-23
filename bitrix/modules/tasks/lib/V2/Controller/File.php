<?php

declare(strict_types=1);

namespace Bitrix\Tasks\V2\Controller;

use Bitrix\Tasks\V2\Entity;
use Bitrix\Tasks\V2\Internals\Repository\DiskFileRepositoryInterface;

class File extends BaseController
{
	/**
	 * @ajaxAction tasks.V2.File.list
	 */
	#[Prefilter\CloseSession]
	public function listAction(
		array $ids,
		DiskFileRepositoryInterface $fileRepository,
	): Entity\DiskFileCollection
	{
		return $fileRepository->getByIds($ids);
	}
}
