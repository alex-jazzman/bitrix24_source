<?php

declare(strict_types=1);

namespace Bitrix\Note\Internal\Service\Collection;

use Bitrix\Main\SystemException;
use Bitrix\Note\Internal\Access\Service\CollectionAccessService;
use Bitrix\Note\Internal\Model\Collection;
use Bitrix\Note\Internal\Model\CollectionTable;
use Bitrix\Note\Internal\Repository\CollectionRepository;
use Bitrix\Note\Internal\Service\User\SystemUser;

class CollectionService
{
	public function __construct(
		private readonly CollectionRepository $repository = new CollectionRepository(),
	)
	{
	}

	/**
	 * Creates a new collection and its default access rows.
	 *
	 * @throws SystemException on persistence failure
	 */
	public function create(string $name, int $userId, int $position = 0): Collection
	{
		$resolvedPosition = $position > 0
			? $position
			: $this->repository->getMaxPosition() + CollectionRepository::POSITION_GAP
		;

		$collection = CollectionTable::createObject()
			->setName($name)
			->setCreatedBy($userId)
			->setPosition($resolvedPosition)
			->setUpdatedBy($userId)
		;

		$saveResult = $this->repository->save($collection);
		if (!$saveResult->isSuccess())
		{
			throw new SystemException($this->buildSaveErrorMessage(
				$saveResult->getErrorMessages(),
				'Unable to save collection.'
			));
		}

		$saved = $saveResult->getData()['collection'] ?? null;
		if (!$saved instanceof Collection)
		{
			throw new SystemException('Unable to save collection.');
		}

		CollectionAccessService::createDefaultAccess((int)$saved->getId(), $userId);

		return $saved;
	}

	/**
	 * Updates an existing collection. Returns null if collection not found.
	 *
	 * @throws SystemException on persistence failure
	 */
	public function update(int $id, string $name, int $userId): ?Collection
	{
		$collection = $this->repository->getById($id);
		if ($collection === null)
		{
			return null;
		}

		$collection->setName($name);
		$collection->setUpdatedBy($userId);

		$saveResult = $this->repository->save($collection);
		if (!$saveResult->isSuccess())
		{
			throw new SystemException($this->buildSaveErrorMessage(
				$saveResult->getErrorMessages(),
				'Unable to save collection.'
			));
		}

		$saved = $saveResult->getData()['collection'] ?? null;
		if (!$saved instanceof Collection)
		{
			throw new SystemException('Unable to save collection.');
		}

		return $saved;
	}

	/**
	 * System-level collection creation without a user actor or default ACL.
	 * CREATED_BY / UPDATED_BY are set to SystemUser::ID. The caller is
	 * responsible for installing access policy via
	 * CollectionAccessService::installSystemPolicy().
	 *
	 * Use only for module bootstrap (welcome content). Do NOT call from
	 * user-facing code — use create() instead.
	 *
	 * Returns the new collection id or null on failure.
	 */
	public function createAsSystem(string $name, int $position = 0): ?int
	{
		$resolvedPosition = $position > 0
			? $position
			: $this->repository->getMaxPosition() + CollectionRepository::POSITION_GAP
		;

		$collection = CollectionTable::createObject()
			->setName($name)
			->setCreatedBy(SystemUser::ID)
			->setPosition($resolvedPosition)
			->setUpdatedBy(SystemUser::ID)
		;

		$saveResult = $this->repository->save($collection);
		if (!$saveResult->isSuccess())
		{
			return null;
		}

		$saved = $saveResult->getData()['collection'] ?? null;
		if (!$saved instanceof Collection)
		{
			return null;
		}

		$id = (int)$saved->getId();

		return $id > 0 ? $id : null;
	}

	private function buildSaveErrorMessage(array $errorMessages, string $defaultMessage): string
	{
		return empty($errorMessages) ? $defaultMessage : implode(', ', $errorMessages);
	}
}
