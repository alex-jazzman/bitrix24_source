<?php

declare(strict_types=1);

namespace Bitrix\Note\Internal\Service\Import;

use Bitrix\Note\Internal\Repository\UnresolvedMentionRepository;

class UnresolvedMentionService
{
	public function __construct(
		private readonly UnresolvedMentionRepository $repository = new UnresolvedMentionRepository(),
	)
	{
	}

	/**
	 * @param array<int, array{DOCUMENT_ID: int, SOURCE_TYPE: string, EXTERNAL_ID: string}> $rows
	 */
	public function addBatch(array $rows): void
	{
		$this->repository->addMulti($rows);
	}

	/**
	 * @param int[] $documentIds
	 */
	public function deleteByDocumentIds(array $documentIds): void
	{
		$this->repository->deleteByDocumentIds($documentIds);
	}

	/**
	 * @param int[] $ids
	 */
	public function deleteByIds(array $ids): void
	{
		$this->repository->deleteByIds($ids);
	}

	/**
	 * @return array<array{
	 *     ID: int,
	 *     DOCUMENT_ID: int,
	 *     EXTERNAL_ID: string,
	 *     TARGET_DOCUMENT_ID: ?int,
	 *     TARGET_COLLECTION_ID: ?int,
	 * }>
	 */
	public function findResolvable(string $sourceType, int $batchSize = 50, ?callable $urlIdExtractor = null): array
	{
		return $this->repository->findResolvable($sourceType, $batchSize, $urlIdExtractor);
	}
}
