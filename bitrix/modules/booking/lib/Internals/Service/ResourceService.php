<?php

declare(strict_types=1);

namespace Bitrix\Booking\Internals\Service;

use Bitrix\Booking\Entity;
use Bitrix\Booking\Internals\Exception\Resource\ExternalResourceException;
use Bitrix\Booking\Internals\Repository\ORM\BookingResourceRepository;
use Bitrix\Booking\Internals\Repository\ResourceRepositoryInterface;
use Bitrix\Booking\Internals\Repository\ResourceTypeRepositoryInterface;
use Bitrix\Booking\Provider\Params\Resource\ResourceFilter;

class ResourceService
{
	public function __construct(
		private readonly BookingResourceRepository $bookingResourceRepository,
		private readonly ResourceRepositoryInterface $resourceRepository,
		private readonly ResourceTypeRepositoryInterface $resourceTypeRepository,
	)
	{
	}

	public function handleResourceRelations(
		Entity\Booking\Booking $booking,
		Entity\Resource\ResourceCollection $resourceCollection
	): void
	{
		$this->bookingResourceRepository->link($booking, $resourceCollection);
		$booking->setResourceCollection($resourceCollection);
	}

	public function loadResourceCollection(
		Entity\Resource\ResourceCollection $resourceCollection
	): Entity\Resource\ResourceCollection
	{
		$resourceIds = $this->getExternalResourceIds($resourceCollection) ?? [];
		/** @var Resource $resource */
		foreach ($resourceCollection as $resource)
		{
			$resourceIds[] = $resource->getId();
		}

		$result = new Entity\Resource\ResourceCollection();
		/**
		 * Resource order matters here!
		 * Primary resource always goes first
		 */
		foreach ($resourceIds as $resourceId)
		{
			$resource = $this->resourceRepository->getById($resourceId);
			if ($resource)
			{
				$result->add($resource);
			}
		}

		return $result;
	}

	private function getExternalResourceIds(Entity\Resource\ResourceCollection $resourceCollection): array
	{
		$externalResourceIds = [];

		/** @var Entity\Resource\Resource $resource */
		foreach ($resourceCollection as $resource)
		{
			if (!$resource->isExternal())
			{
				continue;
			}

			if (!$resource?->getType()?->getModuleId())
			{
				throw new ExternalResourceException('ModuleId of resource type is not specified');
			}

			if (!$resource?->getType()?->getCode())
			{
				throw new ExternalResourceException('Code of resource type is not specified');
			}

			$externalType = $this->resourceTypeRepository->getByModuleIdAndCode(
				$resource->getType()?->getModuleId(),
				$resource->getType()?->getCode(),
			);

			if ($externalType === null)
			{
				$externalTypeId = $this->resourceTypeRepository->save($resource->getType());
				$externalType = $this->resourceTypeRepository->getById($externalTypeId);
			}

			$externalResource = $this->resourceRepository->getList(
				filter: (new ResourceFilter([
					'TYPE_ID' => $externalType->getId(),
					'EXTERNAL_ID' => $resource->getExternalId(),
				]))->prepareFilter(),
			)->getFirstCollectionItem();

			if ($externalResource === null)
			{
				$resource->setType($externalType);
				$externalResource = $this->resourceRepository->save($resource);
			}

			$externalResourceIds[] = $externalResource->getId();
		}

		return $externalResourceIds;
	}
}
