<?php

declare(strict_types=1);

namespace Bitrix\Tasks\V2\Internals\Repository;

use Bitrix\Tasks\V2\Entity;

interface DiskFileRepositoryInterface
{
	public function getByIds(array $ids): Entity\DiskFileCollection;
}