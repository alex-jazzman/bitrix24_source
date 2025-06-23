<?php

declare(strict_types=1);

namespace Bitrix\Tasks\V2\Internals\Repository;

use Bitrix\Tasks\V2\Entity\Template;

interface TemplateRepositoryInterface
{
	public function getById(int $id): ?Template;

	public function save(Template $entity, int $userId): int;

	public function delete(int $id, int $userId): void;
}
