<?php

declare(strict_types=1);

namespace Bitrix\Note\Internal\Service\RecycleBin;

use Bitrix\Note\Internal\Access\Service\DocumentAccessService;
use Bitrix\Note\Internal\Repository\DocumentFileLinkRepository;
use Bitrix\Note\Internal\Repository\DocumentRepository;
use Bitrix\Note\Internal\Repository\DocumentSearchRepository;
use Bitrix\Note\Internal\Repository\DocumentUpdateRepository;
use Bitrix\Note\Internal\Repository\ImportMapRepository;
use Bitrix\Note\Internal\Repository\RecycleBinRepository;
use Bitrix\Note\Internal\Repository\UnresolvedMentionRepository;
use Bitrix\Note\Internal\Service\Search\SearchIndexService;

class HardDeleteService
{
	public function __construct(
		private readonly DocumentRepository $documentRepository = new DocumentRepository(),
		private readonly DocumentUpdateRepository $documentUpdateRepository = new DocumentUpdateRepository(),
		private readonly DocumentFileLinkRepository $documentFileLinkRepository = new DocumentFileLinkRepository(),
		private readonly ImportMapRepository $importMapRepository = new ImportMapRepository(),
		private readonly RecycleBinRepository $recycleBinRepository = new RecycleBinRepository(),
		private readonly UnresolvedMentionRepository $unresolvedMentionRepository = new UnresolvedMentionRepository(),
		private readonly ?DocumentSearchRepository $documentSearchRepository = null,
		private readonly SearchIndexService $searchIndexService = new SearchIndexService(),
	) {}

	/**
	 * Cascade hard-delete for the given document ids — DB-only side effects.
	 *
	 * Order is fixed to avoid FK-style logical conflicts: dependents first, then the document,
	 * then the recycle-bin entry. Non-transactional side effects (CFile, search index) are
	 * intentionally NOT performed here — the caller MUST invoke {@see runPostCommitCleanup()}
	 * after a successful commit so a rollback never leaves orphaned files or a stale index.
	 *
	 * Transaction is the caller's responsibility (per MODULE.md).
	 *
	 * @param int[] $documentIds
	 * @return array{fileIds: int[], documentIds: int[]} payload to feed into runPostCommitCleanup()
	 */
	public function deleteByDocumentIds(array $documentIds): array
	{
		$normalized = array_values(array_unique(array_filter(
			array_map(static fn($id): int => (int)$id, $documentIds),
			static fn(int $id): bool => $id > 0,
		)));
		if (empty($normalized))
		{
			return ['fileIds' => [], 'documentIds' => []];
		}

		$fileIds = $this->collectFileIds($normalized);

		$this->documentFileLinkRepository->deleteByDocumentIds($normalized);
		$this->unresolvedMentionRepository->deleteByDocumentIds($normalized);
		$this->documentUpdateRepository->deleteByDocumentIds($normalized);
		$this->importMapRepository->deleteByDocumentIds($normalized);
		DocumentAccessService::deleteByDocumentIds($normalized);

		$this->documentRepository->deleteByIds($normalized);
		$this->recycleBinRepository->deleteByDocumentIds($normalized);

		return ['fileIds' => $fileIds, 'documentIds' => $normalized];
	}

	/**
	 * Best-effort post-commit cleanup of non-transactional side effects: file storage and
	 * search index. Must be called only AFTER the surrounding DB transaction has committed,
	 * otherwise a rollback would resurrect DB rows whose files/index entries are already gone.
	 *
	 * @param int[] $fileIds
	 * @param int[] $documentIds
	 */
	public function runPostCommitCleanup(array $fileIds, array $documentIds): void
	{
		foreach ($fileIds as $fileId)
		{
			try
			{
				\CFile::Delete((int)$fileId);
			}
			catch (\Throwable)
			{
			}
		}

		if (!empty($documentIds))
		{
			try
			{
				$this->searchIndexService->deindexDocuments($documentIds);
			}
			catch (\Throwable)
			{
			}
		}
	}

	/**
	 * @param int[] $documentIds
	 * @return int[]
	 */
	private function collectFileIds(array $documentIds): array
	{
		$rows = $this->documentFileLinkRepository->getByDocumentIds($documentIds);
		$ids = [];
		foreach ($rows as $row)
		{
			$fileId = (int)($row['FILE_ID'] ?? 0);
			if ($fileId > 0)
			{
				$ids[$fileId] = true;
			}
		}

		return array_keys($ids);
	}
}
