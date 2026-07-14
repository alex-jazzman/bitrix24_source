<?php

declare(strict_types=1);

namespace Bitrix\Note\Internal\Service\Import\Step;

use Bitrix\Main\SystemException;
use Bitrix\Note\Internal\Repository\ImportMapRepository;
use Bitrix\Note\Internal\Service\Collection\CollectionService;
use Bitrix\Note\Internal\Service\Import\CollectionAccessTransfer;
use Bitrix\Note\Internal\Service\Import\ImportLogger;
use Bitrix\Note\Internal\Service\Import\Source\SourceInterface;

class CreateCollectionStep implements StepInterface
{
	private CollectionAccessTransfer $accessTransfer;

	public function __construct(
		private readonly CollectionService $collectionService,
		private readonly ImportMapRepository $mapRepository,
		?CollectionAccessTransfer $accessTransfer = null,
	)
	{
		$this->accessTransfer = $accessTransfer ?? new CollectionAccessTransfer();
	}

	public function execute(array &$option, ?SourceInterface $source): void
	{
		$collectionIds = $option['collectionIds'];
		$collectionIndex = $option['collectionIndex'] ?? 0;
		$currentCollectionId = $collectionIds[$collectionIndex];

		if (!isset($option['collectionNames']))
		{
			$collectionsResult = $source->getCollections();
			$names = [];
			$urlIds = [];
			foreach ($collectionsResult->data['collections'] ?? [] as $c)
			{
				$names[$c['id']] = $c['name'];
				if (!empty($c['urlId']))
				{
					$urlIds[$c['id']] = $c['urlId'];
				}
			}
			$option['collectionNames'] = $names;
			$option['collectionUrlIds'] = $urlIds;
		}

		$collectionName = $option['collectionNames'][$currentCollectionId] ?? $currentCollectionId;
		$collectionUrlId = $option['collectionUrlIds'][$currentCollectionId] ?? null;
		$userId = (int)$option['userId'];
		$overwrite = $option['overwrite'] ?? false;

		$existingCollectionId = $overwrite
			? $this->mapRepository->findCollectionId($option['sourceType'], $currentCollectionId)
			: null;

		if ($existingCollectionId !== null)
		{
			$this->collectionService->update($existingCollectionId, $collectionName, $userId);
			$option['resultCollectionId'] = $existingCollectionId;
			ImportLogger::logInfo("createCollection: reusing {$existingCollectionId} ({$collectionName})");
		}
		else
		{
			$collection = $this->collectionService->create($collectionName, $userId);
			if ($collection === null)
			{
				throw new SystemException('Failed to create collection: ' . $collectionName);
			}

			$option['resultCollectionId'] = (int)$collection->getId();
			$this->mapRepository->saveCollectionMapping(
				$option['sourceType'],
				$currentCollectionId,
				$option['resultCollectionId'],
				$collectionUrlId,
			);
			ImportLogger::logInfo("createCollection: created {$option['resultCollectionId']} ({$collectionName})");
		}

		// Reproduce the source base's access on the new collection (best-effort;
		// no-op for sources without source-side permissions, e.g. Outline).
		$this->accessTransfer->apply($option, $source);

		$option['step'] = 'createStructure';
		$option['importedDocIds'] = [];
		$option['documentOffset'] = 0;
		unset($option['structureQueue'], $option['structureIndex']);
	}
}
