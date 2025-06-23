<?php

declare(strict_types=1);

namespace Bitrix\Tasks\V2\Internals\Service\Link;

use Bitrix\Tasks\DI\Attribute\Inject;
use Bitrix\Tasks\V2\Entity\EntityInterface;
use Bitrix\Tasks\V2\Entity;

class LinkService
{
	public function __construct(
		#[Inject(locatorCode: 'tasks.link.builder.factory')]
		private readonly LinkBuilderFactory $linkBuilderFactory
	)
	{

	}

	public function getCreateTask(int $userId = 0, int $groupId = 0): string
	{
		$parameters = [
			'entityId' => 0,
			'entityType' => 'task',
			'action' => 'edit',
		];

		if ($groupId > 0)
		{
			$parameters['context'] = 'group';
			$parameters['ownerId'] = $groupId;
		}
		else
		{
			$parameters['ownerId'] = $userId;
		}

		return $this->linkBuilderFactory
			->create(...$parameters)
			?->makeEntityPath();
	}

	public function get(EntityInterface $entity, int $userId = 0): ?string
	{
		$parameters = [
			'entityId' => (int)$entity->getId(),
			'ownerId' => $userId,
		];

		if ($entity instanceof Entity\Task)
		{
			$parameters['entityType'] = 'task';
			if ($entity->group?->id > 0)
			{
				$parameters['context'] = 'group';
				$parameters['ownerId'] = $entity->group->id;
			}
		}
		elseif ($entity instanceof Entity\Template)
		{
			$parameters['entityType'] = 'template';
		}

		return $this->linkBuilderFactory
			->create(...$parameters)
			?->makeEntityPath();
	}
}