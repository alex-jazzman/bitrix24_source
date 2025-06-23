<?php

declare(strict_types=1);

namespace Bitrix\Tasks\V2\Access\Factory;

use Bitrix\Main\Access\AccessibleController;
use Bitrix\Tasks\V2\Access\Adapter\EntityModelAdapterInterface;
use Bitrix\Tasks\V2\Entity\EntityInterface;

interface ControllerFactoryInterface
{
	public function create(Type $type, int $userId): ?AccessibleController;
	public function createByClass(string $class, int $userId): ?AccessibleController;

	public function createAdapter(EntityInterface $entity): ?EntityModelAdapterInterface;
}