<?php

namespace Bitrix\Crm\Integration\AI\ContextCollector;

use Bitrix\Crm\Category\Entity\Category;
use Bitrix\Crm\Integration\AI\Contract\ContextCollector;
use Bitrix\Crm\Service\Container;
use Bitrix\Crm\Service\UserPermissions;

final class CategoriesCollector implements ContextCollector
{
	private readonly UserPermissions\EntityPermissions\Category $permissions;

	public function __construct(
		private readonly int $entityTypeId,
		private readonly Context $context,
	)
	{
		$this->permissions = Container::getInstance()
			->getUserPermissions($this->context->userId())
			->category();
	}

	public function collect(): array
	{
		$factory = Container::getInstance()->getFactory($this->entityTypeId);
		if ($factory === null || !$factory->isCategoriesEnabled())
		{
			return [];
		}

		$result = [];
		foreach ($factory->getCategories() as $category)
		{
			if (!$this->permissions->canReadItems($category))
			{
				continue;
			}

			$result[] = [
				'id' => $category->getId(),
				'name' => $category->getName(),
			];
		}

		return $result;
	}
}
