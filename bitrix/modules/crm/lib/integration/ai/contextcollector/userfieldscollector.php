<?php

namespace Bitrix\Crm\Integration\AI\ContextCollector;

use Bitrix\Crm\Integration\AI\Contract\ContextCollector;
use Bitrix\Crm\Service\Container;
use Bitrix\Crm\Service\Factory;
use Bitrix\Crm\Service\UserPermissions;

final class UserFieldsCollector implements ContextCollector
{
	private UserPermissions\EntityPermissions\Type $permissions;
	private ?Factory $factory;

	public function __construct(
		private readonly int $entityTypeId,
		private readonly Context $context,
	)
	{
		$this->factory = Container::getInstance()->getFactory($this->entityTypeId);
		$this->permissions = Container::getInstance()->getUserPermissions($this->context->userId())->entityType();
	}

	public function collect(): array
	{
		if ($this->factory === null || !$this->permissions->canReadItems($this->entityTypeId))
		{
			return [];
		}

		$result = [];
		foreach ($this->factory->getUserFieldsCollection() as $field)
		{
			$result[] = [
				'name' => $field->getName(),
				'title' => $field->getTitle(),
				'type' => $field->getType(),
			];
		}

		return $result;
	}
}
