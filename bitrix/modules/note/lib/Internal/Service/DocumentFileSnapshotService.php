<?php

declare(strict_types=1);

namespace Bitrix\Note\Internal\Service;

use Bitrix\Main\Result;
use Bitrix\Note\Internal\Repository\DocumentFileLinkRepository;

class DocumentFileSnapshotService
{
	private DocumentFileLinkRepository $linkRepository;
	private DocumentFileCleanupService $cleanupService;

	public function __construct(
		?DocumentFileLinkRepository $linkRepository = null,
		?DocumentFileCleanupService $cleanupService = null,
	)
	{
		$this->linkRepository = $linkRepository ?? new DocumentFileLinkRepository();
		$this->cleanupService = $cleanupService ?? new DocumentFileCleanupService($this->linkRepository);
	}

	/**
	 * Temporarily disabled: reconcile causes race condition with concurrent file uploads during autosave.
	 * Will be replaced with a more stable file cleanup strategy.
	 */
	public function reconcileByDocumentAndReferencedFileIds(int $documentId, array $referencedFileIds): Result
	{
		$result = new Result();
		$result->setData([
			'deletedFileIds' => [],
			'failedFileIds' => [],
			'unknownReferencedFileIds' => [],
			'linkedFileIds' => [],
		]);

		return $result;
	}

	private function extractLinkedFileIds(array $rows): array
	{
		$fileIds = [];
		foreach ($rows as $row)
		{
			$fileIds[] = (int)($row['FILE_ID'] ?? 0);
		}

		return $this->normalizeIds($fileIds);
	}

	private function normalizeIds(array $ids): array
	{
		$normalized = array_values(array_unique(array_filter(
			array_map(static fn($id): int => (int)$id, $ids),
			static fn(int $id): bool => $id > 0,
		)));
		sort($normalized);

		return $normalized;
	}
}
