<?php

declare(strict_types=1);

namespace Bitrix\Note\Internal\Service\Import\Step;

use Bitrix\Main\Localization\Loc;
use Bitrix\Main\SystemException;
use Bitrix\Note\Internal\Model\DocumentTable;
use Bitrix\Note\Internal\Repository\ImportMapRepository;
use Bitrix\Note\Internal\Service\Analytics\AnalyticsDictionary;
use Bitrix\Note\Internal\Service\Analytics\AnalyticsService;
use Bitrix\Note\Internal\Service\Analytics\AnalyticsStats;
use Bitrix\Note\Internal\Service\Document\DocumentService;
use Bitrix\Note\Internal\Service\Import\ImportLogger;
use Bitrix\Note\Internal\Service\Import\Source\SourceInterface;
use Bitrix\Note\Internal\Service\Import\Transformer\MdTransformerFactory;
use Bitrix\Note\Internal\Service\Import\Transformer\MentionTransformerFactory;
use Bitrix\Note\Internal\Service\Import\UnresolvedMentionService;

class FillContentStep implements StepInterface
{
	private const BATCH_SIZE = 100;

	public function __construct(
		private readonly DocumentService $documentService,
		private readonly UnresolvedMentionService $unresolvedMentionService,
		private readonly ImportMapRepository $mapRepository,
	)
	{
	}

	public function execute(array &$option, ?SourceInterface $source): void
	{
		$collectionIds = $option['collectionIds'];
		$collectionIndex = $option['collectionIndex'] ?? 0;
		$currentCollectionId = $collectionIds[$collectionIndex];
		$offset = $option['documentOffset'] ?? 0;
		$userId = (int)$option['userId'];

		$result = $source->getDocumentsPage($currentCollectionId, $offset, self::BATCH_SIZE);
		if (!$result->success)
		{
			throw new SystemException('Failed to fetch documents');
		}

		$documents = $result->data['documents'] ?? [];

		$mentionTransformer = MentionTransformerFactory::create(
			$option['sourceType'],
			$this->mapRepository,
			$option['sourceUrl'],
		);
		$mdTransformer = MdTransformerFactory::create($option['sourceType']);

		$externalIds = [];
		$markdownTexts = [];
		foreach ($documents as $doc)
		{
			$externalId = $doc['id'] ?? null;
			if ($externalId !== null)
			{
				$externalIds[] = $externalId;
			}
			$markdownTexts[] = $doc['text'] ?? '';
		}
		$mappings = $this->mapRepository->bulkLookup($option['sourceType'], $externalIds);

		// Backfill URL_ID for every doc in this batch before mention preload runs.
		// CreateStructureStep populates mappings from the tree endpoint, which doesn't always
		// expose urlId; documents.list does. Without this, links carrying slug-urlId form would
		// miss in import_map.URL_ID and degrade to fallback external links inside this same import.
		foreach ($documents as $doc)
		{
			$externalId = $doc['id'] ?? null;
			$urlId = $doc['urlId'] ?? null;
			$docId = $externalId !== null ? ($mappings[$externalId]['documentId'] ?? null) : null;
			if ($externalId !== null && $urlId !== null && $docId !== null)
			{
				$this->mapRepository->saveDocumentMapping(
					$option['sourceType'],
					$externalId,
					$docId,
					$urlId,
				);
			}
		}

		// Прогрев кеша mention-резолва: один bulkLookup на все mentions всех документов batch-а.
		$mentionTransformer->preload($markdownTexts);

		$processedDocIds = [];
		$unresolvedRowsToInsert = [];

		foreach ($documents as $doc)
		{
			try
			{
				$externalId = $doc['id'] ?? null;
				$title = ($doc['title'] ?? '') !== '' ? $doc['title'] : 'Untitled';
				$text = $doc['text'] ?? '';

				if ($externalId === null)
				{
					continue;
				}

				$docId = $mappings[$externalId]['documentId'] ?? null;
				if ($docId === null)
				{
					$docId = $this->createMissingDocument($option, $externalId, $title, $userId);
					if ($docId === null)
					{
						continue;
					}
				}

				$mentionResult = $mentionTransformer->transform($text);
				$transformedText = $mentionResult->markdown !== '' ? $mentionResult->markdown : "\n";
				$transformedText = $mdTransformer->preprocessMarkdown($transformedText);
				if ($transformedText === '' || $transformedText === null)
				{
					$transformedText = "\n";
				}

				$this->documentService->update(
					id: $docId,
					title: $title,
					markdown: $transformedText,
					userId: $userId,
					contentFormat: DocumentTable::CONTENT_FORMAT_MD,
				);

				$this->documentService->clearYjsState($docId);

				$processedDocIds[] = $docId;

				$option['doneCount'] = ($option['doneCount'] ?? 0) + 1;
				$option['totalAttachments'] = ($option['totalAttachments'] ?? 0)
					+ count($mdTransformer->extractAttachmentIds($transformedText));

				foreach ($mentionResult->unresolvedIds as $unresolvedId)
				{
					$unresolvedRowsToInsert[] = [
						'DOCUMENT_ID' => $docId,
						'SOURCE_TYPE' => $option['sourceType'],
						'EXTERNAL_ID' => $unresolvedId,
					];
				}

				// Exactly one create_document marker per imported source page (success outcome).
				// Emitted last in try so a throw earlier routes solely to catch (no double marker).
				AnalyticsService::documentCreated(
					true,
					AnalyticsStats::buildDocumentImportStats((string)$option['sourceType']),
					AnalyticsDictionary::TYPE_IMPORT,
				);
			}
			catch (\Throwable $e)
			{
				$docTitle = $doc['title'] ?? ($doc['id'] ?? '');
				ImportLogger::logError("fillContent error [{$docTitle}]: " . $e->getMessage());
				ImportLogger::addErrorDetail($option, $docTitle, ImportLogger::resolveErrorReason($e));

				// Error outcome for the same source page (still exactly one marker per page).
				AnalyticsService::documentCreated(
					false,
					AnalyticsStats::buildDocumentImportStats((string)$option['sourceType']),
					AnalyticsDictionary::TYPE_IMPORT,
				);
			}
		}

		if (!empty($processedDocIds))
		{
			$this->unresolvedMentionService->deleteByDocumentIds($processedDocIds);
		}

		if (!empty($unresolvedRowsToInsert))
		{
			$this->unresolvedMentionService->addBatch($unresolvedRowsToInsert);
		}

		$option['documentOffset'] = $offset + count($documents);

		if (count($documents) < self::BATCH_SIZE)
		{
			$option['step'] = 'downloadAttachments';
			$option['attachmentDocIndex'] = 0;
			$option['attachmentFileIndex'] = 0;
		}
	}

	private function createMissingDocument(array &$option, string $externalId, string $title, int $userId): ?int
	{
		$collectionId = $option['resultCollectionId'] ?? null;
		if ($collectionId === null)
		{
			ImportLogger::logError("fillContent: no resultCollectionId for missing doc externalId={$externalId}");

			return null;
		}

		ImportLogger::logInfo("fillContent: creating missing document [{$title}] externalId={$externalId}");

		try
		{
			$savedDoc = $this->documentService->create(
				collectionId: $collectionId,
				parentId: null,
				title: $title,
				markdown: "\n",
				userId: $userId,
				contentFormat: DocumentTable::CONTENT_FORMAT_MD,
			);

			$docId = (int)$savedDoc->getId();
			$this->mapRepository->saveDocumentMapping($option['sourceType'], $externalId, $docId);
			$option['importedDocIds'][] = $docId;

			return $docId;
		}
		catch (\Throwable $e)
		{
			ImportLogger::logError("fillContent: failed to create missing doc [{$title}]: " . $e->getMessage());
			ImportLogger::addErrorDetail($option, $title, ImportLogger::resolveErrorReason($e));

			return null;
		}
	}
}
