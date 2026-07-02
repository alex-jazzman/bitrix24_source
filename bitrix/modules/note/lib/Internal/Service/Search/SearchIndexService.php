<?php

declare(strict_types=1);

namespace Bitrix\Note\Internal\Service\Search;

use Bitrix\Note\Internal\Entity\Search\SearchIndexEntry;
use Bitrix\Note\Internal\Model\DocumentTable;
use Bitrix\Note\Internal\Repository\DocumentSearchRepository;
use Bitrix\Note\Internal\Service\RecycleBin\RecycleBinFilter;

class SearchIndexService
{
	public function __construct(
		private readonly DocumentSearchRepository $repository = new DocumentSearchRepository(),
		private readonly MarkdownStripper $stripper = new MarkdownStripper(),
		private readonly RecycleBinFilter $recycleBinFilter = new RecycleBinFilter(),
	) {}

	/**
	 * Indexes (or reindexes) a document.
	 * When $markdown or $title is null, missing fields are read from b_note_document.
	 */
	public function indexDocument(int $documentId, ?string $markdown = null, ?string $title = null): void
	{
		if ($documentId <= 0)
		{
			return;
		}

		if ($this->recycleBinFilter->isInRecycleBin($documentId))
		{
			return;
		}

		if ($markdown === null || $title === null)
		{
			$select = [];
			if ($title === null)
			{
				$select[] = 'TITLE';
			}
			if ($markdown === null)
			{
				$select[] = 'MARKDOWN';
			}

			$row = DocumentTable::query()
				->setSelect($select)
				->where('ID', $documentId)
				->fetch()
			;
			if ($row === false)
			{
				return;
			}

			$title ??= (string)($row['TITLE'] ?? '');
			$markdown ??= (string)($row['MARKDOWN'] ?? '');
		}

		$title = trim($title);
		$content = $this->stripper->strip($markdown);
		$body = $title !== '' ? $title . "\n" . $content : $content;

		$this->repository->save(new SearchIndexEntry($documentId, $body));
	}

	public function deindexDocument(int $documentId): void
	{
		$this->repository->delete($documentId);
	}

	/**
	 * Bulk-removes search index entries for a set of documents (used by archive cascade).
	 *
	 * @param int[] $documentIds
	 */
	public function deindexDocuments(array $documentIds): void
	{
		$this->repository->deleteByIds($documentIds);
	}

	/**
	 * Reindexes a list of documents (used by RestoreAll).
	 * One bulk SELECT to read titles+markdown, then per-document save (acceptable for rare use).
	 *
	 * @param int[] $documentIds
	 */
	public function reindexByIds(array $documentIds): void
	{
		$normalized = array_values(array_unique(array_filter(
			array_map(static fn($id): int => (int)$id, $documentIds),
			static fn(int $id): bool => $id > 0,
		)));
		if (empty($normalized))
		{
			return;
		}

		$rows = DocumentTable::query()
			->setSelect(['ID', 'TITLE', 'MARKDOWN'])
			->whereIn('ID', $normalized)
			->whereNull('RECYCLE_BIN.ID')
			->exec()
		;

		while ($row = $rows->fetch())
		{
			$id = (int)$row['ID'];
			$title = trim((string)($row['TITLE'] ?? ''));
			$content = $this->stripper->strip((string)($row['MARKDOWN'] ?? ''));
			$body = $title !== '' ? $title . "\n" . $content : $content;
			$this->repository->save(new SearchIndexEntry($id, $body));
		}
	}
}
