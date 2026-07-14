<?php

declare(strict_types=1);

namespace Bitrix\Note\Public\Command;

use Bitrix\Main\Application;
use Bitrix\Main\Command\AbstractCommand;
use Bitrix\Main\Result;
use Bitrix\Note\Internal\Exceptions\DocumentArchivedException;
use Bitrix\Note\Internal\Exceptions\DocumentHasUnsavedChangesException;
use Bitrix\Note\Internal\Exceptions\DocumentInRecycleBinException;
use Bitrix\Note\Internal\Exceptions\DocumentNotFoundException;
use Bitrix\Note\Internal\Model\DocumentTable;
use Bitrix\Note\Internal\Repository\DocumentRepository;
use Bitrix\Note\Internal\Repository\DocumentUpdateRepository;
use Bitrix\Note\Internal\Service\Collaboration\PushNotificationService;
use Bitrix\Note\Internal\Service\RecycleBin\RecycleBinFilter;
use Bitrix\Note\Internal\Service\Search\SearchIndexService;

class OverwriteDocumentContentCommand extends AbstractCommand
{
	public function __construct(
		private readonly int $documentId,
		private readonly string $markdown,
		private readonly int $userId,
		private readonly bool $overwrite = false,
		private readonly ?string $title = null,
		private readonly DocumentRepository $documentRepository = new DocumentRepository(),
		private readonly DocumentUpdateRepository $updateRepository = new DocumentUpdateRepository(),
		private readonly PushNotificationService $pushService = new PushNotificationService(),
		private readonly SearchIndexService $searchIndexService = new SearchIndexService(),
		private readonly RecycleBinFilter $recycleBinFilter = new RecycleBinFilter(),
	) {}

	protected function execute(): Result
	{
		$document = $this->documentRepository->getMetaById(
			$this->documentId,
			['ID', 'COLLECTION_ID', 'TITLE', 'IS_ARCHIVED', 'CONTENT_FORMAT', 'UPDATED_AT'],
		);
		if ($document === null)
		{
			throw new DocumentNotFoundException();
		}

		if ($this->recycleBinFilter->isInRecycleBin($this->documentId))
		{
			throw new DocumentInRecycleBinException();
		}

		if ($document->getIsArchived())
		{
			throw new DocumentArchivedException();
		}

		$format = (string)$document->getContentFormat();
		$isCollaborative = $format === DocumentTable::CONTENT_FORMAT_YJS
			|| $format === DocumentTable::CONTENT_FORMAT_JSON;

		// Guard outside the transaction: do not open it just to roll back.
		if ($isCollaborative && !$this->overwrite && $this->updateRepository->hasAnyByDocumentId($this->documentId))
		{
			throw new DocumentHasUnsavedChangesException();
		}

		$connection = Application::getConnection();
		$connection->startTransaction();

		try
		{
			$document->setMarkdown($this->markdown);
			if ($this->title !== null)
			{
				$document->setTitle($this->title);
			}
			$document->setUpdatedBy($this->userId);

			if ($isCollaborative)
			{
				// Demote the document to the plain-markdown format: the realtime CRDT
				// state becomes orphaned and uncommitted patches no longer apply.
				$document->setContentFormat(DocumentTable::CONTENT_FORMAT_MD);
				$document->setYjsState(null);
			}

			$saveResult = $this->documentRepository->save($document);
			if (!$saveResult->isSuccess())
			{
				throw new \RuntimeException('Failed to save document: ' . implode(', ', $saveResult->getErrorMessages()));
			}

			if ($isCollaborative)
			{
				$this->updateRepository->deleteByDocumentId($this->documentId);
			}

			$connection->commitTransaction();
		}
		catch (\Throwable $e)
		{
			$connection->rollbackTransaction();

			throw $e;
		}

		$documentId = $this->documentId;
		$userId = $this->userId;
		$overwrite = $this->overwrite;
		$searchIndexService = $this->searchIndexService;
		$pushService = $this->pushService;
		$collectionId = (int)$document->getCollectionId();
		$titleChanged = $this->title !== null;
		$newTitle = (string)$document->getTitle();
		// Both already persisted above — hand them to the indexer so it skips the re-read SELECT.
		$newMarkdown = $this->markdown;

		$this->pushService->dispatchAfterCommit(static function () use (
			$documentId,
			$collectionId,
			$userId,
			$overwrite,
			$isCollaborative,
			$titleChanged,
			$newTitle,
			$newMarkdown,
			$searchIndexService,
			$pushService,
		): void {
			try
			{
				$searchIndexService->indexDocument($documentId, $newMarkdown, $newTitle);
			}
			catch (\Throwable)
			{
			}

			if ($isCollaborative)
			{
				$pushService->sendDocumentContentOverwritten($documentId, $userId, $overwrite);
			}

			if ($titleChanged)
			{
				// Reuses documentUpdate path so sidebar/breadcrumbs/header all refresh via existing FE handlers.
				// No initiator skip: overwrite is an out-of-band REST write, so the initiator's own open
				// sessions must refresh too (same rationale as documentContentOverwritten above).
				$payload = [
					'documentId' => $documentId,
					'collectionId' => $collectionId,
					'title' => $newTitle,
				];
				$pushService->sendToCollection($collectionId, 'documentUpdate', $payload);
				$pushService->sendToDocument($documentId, 'documentUpdate', $payload);
			}
		});

		return new Result();
	}
}
