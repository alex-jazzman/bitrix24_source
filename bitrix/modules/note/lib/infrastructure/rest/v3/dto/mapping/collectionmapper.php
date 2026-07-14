<?php

declare(strict_types=1);

namespace Bitrix\Note\Infrastructure\Rest\V3\Dto\Mapping;

use Bitrix\Main\Type\DateTime;
use Bitrix\Note\Infrastructure\Rest\V3\Dto\CollectionItemDto;
use Bitrix\Note\Internal\Access\Service\CollectionAccessService;
use Bitrix\Note\Internal\Model\Collection;
use Bitrix\Rest\V3\Dto\DtoCollection;
use Bitrix\Rest\V3\Dto\Mapping\Mapper;

class CollectionMapper extends Mapper
{
	/**
	 * @param Collection[] $items
	 */
	public function mapCollection(array $items, array $fields = []): DtoCollection
	{
		$collection = new DtoCollection(CollectionItemDto::class);
		foreach ($items as $item)
		{
			$collection->add($this->mapEntity($item));
		}

		return $collection;
	}

	private function mapEntity(Collection $entity): CollectionItemDto
	{
		$dto = new CollectionItemDto();
		$dto->id = (int)$entity->getId();
		$dto->name = (string)$entity->getName();
		$dto->position = (int)$entity->getPosition();
		$dto->policyLevel = CollectionAccessService::levelToCode($entity->getPolicyLevel());
		$dto->createdBy = (int)$entity->getCreatedBy();
		$dto->createdAt = $this->formatUtc($entity->getCreatedAt());
		$dto->updatedBy = (int)$entity->getUpdatedBy();
		$dto->updatedAt = $this->formatUtc($entity->getUpdatedAt());

		return $dto;
	}

	// REST contract: datetime is always returned in UTC (ISO 8601 with Z).
	private function formatUtc(?DateTime $dateTime): ?string
	{
		return $dateTime === null
			? null
			: gmdate('Y-m-d\TH:i:s\Z', $dateTime->getTimestamp());
	}
}
