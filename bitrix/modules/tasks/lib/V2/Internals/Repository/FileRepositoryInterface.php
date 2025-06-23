<?php

declare(strict_types=1);

namespace Bitrix\Tasks\V2\Internals\Repository;

use Bitrix\Tasks\V2\Entity;

interface FileRepositoryInterface
{
	public function getById(int $id): ?Entity\File;
	public function getByIds(array $ids): Entity\FileCollection;
}
