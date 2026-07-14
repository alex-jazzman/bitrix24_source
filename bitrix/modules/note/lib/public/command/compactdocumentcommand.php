<?php

declare(strict_types=1);

namespace Bitrix\Note\Public\Command;

use Bitrix\Main\Application;
use Bitrix\Main\Command\AbstractCommand;
use Bitrix\Main\Result;
use Bitrix\Main\SystemException;
use Bitrix\Note\Internal\Exceptions\DocumentArchivedException;
use Bitrix\Note\Internal\Exceptions\DocumentInRecycleBinException;
use Bitrix\Note\Internal\Repository\DocumentRepository;
use Bitrix\Note\Internal\Repository\DocumentUpdateRepository;
use Bitrix\Note\Internal\Service\Collaboration\DocumentLockService;
use Bitrix\Note\Internal\Service\RecycleBin\RecycleBinFilter;
use Bitrix\Note\Internal\Service\Search\SearchIndexService;

class CompactDocumentCommand extends AbstractCommand
{
	public function __construct(
		private readonly int $documentId,
		private readonly int $userId,
		private readonly string $markdown,
		private readonly int $processedUpToId,
		private readonly ?string $yjsState = null,
		private readonly DocumentRepository $documentRepository = new DocumentRepository(),
		private readonly DocumentUpdateRepository $updateRepository = new DocumentUpdateRepository(),
		private readonly DocumentLockService $lockService = new DocumentLockService(),
		private readonly SearchIndexService $searchIndexService = new SearchIndexService(),
		private readonly RecycleBinFilter $recycleBinFilter = new RecycleBinFilter(),
	) {}

	protected function execute(): Result
	{
		if (!$this->lockService->acquireLock($this->documentId))
		{
			$result = new Result();
			$result->setData(['locked' => true]);

			return $result;
		}

		try
		{
			$this->performCompaction();
		}
		finally
		{
			$this->lockService->releaseLock($this->documentId);
		}

		return new Result();
	}

	private function performCompaction(): void
	{
		$document = $this->documentRepository->getMetaById(
			$this->documentId,
			['ID', 'TITLE', 'IS_ARCHIVED', 'UPDATED_AT'],
		);
		if ($document === null)
		{
			throw new SystemException('Document not found');
		}

		if ($this->recycleBinFilter->isInRecycleBin($this->documentId))
		{
			throw new DocumentInRecycleBinException();
		}

		if ($document->getIsArchived())
		{
			throw new DocumentArchivedException();
		}

		$connection = Application::getConnection();
		$connection->startTransaction();

		try
		{
			$document->setMarkdown($this->markdown);
			if ($this->yjsState !== null)
			{
				$document->setYjsState($this->yjsState);
			}
			$document->setUpdatedBy($this->userId);
			$saveResult = $this->documentRepository->save($document);
			if (!$saveResult->isSuccess())
			{
				throw new SystemException('Failed to save document');
			}

			$this->updateRepository->deleteUpToId($this->documentId, $this->processedUpToId);

			// Full-text index update is part of the same transaction: if the commit
			// fails, the index stays consistent with the document's previous markdown.
			// Failure of the indexing step itself must not abort compact.
			try
			{
				$this->searchIndexService->indexDocument($this->documentId, $this->markdown, $document->getTitle());
			}
			catch (\Throwable)
			{
			}

			$connection->commitTransaction();
		}
		catch (\Throwable $e)
		{
			$connection->rollbackTransaction();

			throw $e;
		}
	}
}
