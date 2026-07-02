<?php

declare(strict_types=1);

namespace Bitrix\Note\Internal\Service\Import\Step;

use Bitrix\Main\Localization\Loc;
use Bitrix\Note\Internal\Service\Document\DocumentService;
use Bitrix\Note\Internal\Service\Import\ImportFileService;
use Bitrix\Note\Internal\Service\Import\ImportLogger;
use Bitrix\Note\Internal\Service\Import\Source\SourceInterface;
use Bitrix\Note\Internal\Service\Import\Transformer\MdTransformerFactory;

class RetryAttachmentsStep implements StepInterface
{
	/**
	 * @var array<int, array{markdown: string}>
	 */
	private array $docCache = [];

	public function __construct(
		private readonly DocumentService $documentService,
		private readonly ImportFileService $fileService,
	)
	{
	}

	public function execute(array &$option, ?SourceInterface $source): void
	{
		$failed = $option['failedAttachments'] ?? [];
		unset($option['failedAttachments']);

		if (empty($failed))
		{
			$option['step'] = 'reconcile';

			return;
		}

		$userId = (int)$option['userId'];
		$mdTransformer = MdTransformerFactory::create($option['sourceType']);
		$retrySuccessByDoc = [];
		$retryCount = count($failed);
		$successCount = 0;

		$this->preloadDocuments($failed);

		foreach ($failed as $entry)
		{
			$docId = (int)$entry['docId'];
			$attachmentId = $entry['attachmentId'];

			$downloadResult = $source->downloadAttachment($attachmentId);
			if (!$downloadResult->success)
			{
				ImportLogger::logError("Retry download failed: attachmentId={$attachmentId}, docId={$docId}");
				ImportLogger::addErrorDetail(
					$option,
					$attachmentId,
					Loc::getMessage('NOTE_IMPORT_ERROR_ATTACHMENT_DOWNLOAD_FAILED'),
				);

				continue;
			}

			$tmpPath = $downloadResult->data['tmpPath'];
			$fileName = $downloadResult->data['fileName'];
			$contentType = $downloadResult->data['contentType'];
			$size = $downloadResult->data['size'];

			$fileId = $this->fileService->saveAttachment($tmpPath, $fileName, $contentType, $size);
			if ($fileId === null)
			{
				ImportLogger::logError("Retry save failed: attachmentId={$attachmentId}, docId={$docId}, fileName={$fileName}");
				ImportLogger::addErrorDetail(
					$option,
					$fileName,
					Loc::getMessage('NOTE_IMPORT_ERROR_ATTACHMENT_SAVE_FAILED'),
				);

				continue;
			}

			$this->fileService->linkFileToDocument($docId, $fileId, $userId);
			$retrySuccessByDoc[$docId][$attachmentId] = [
				'fileId' => $fileId,
				'name' => $fileName,
				'size' => $size,
				'mimeType' => $contentType,
			];
			$option['doneAttachments'] = ($option['doneAttachments'] ?? 0) + 1;
			$successCount++;
		}

		foreach ($retrySuccessByDoc as $docId => $attachmentFileMap)
		{
			$markdown = $this->docCache[$docId]['markdown'] ?? '';
			if ($markdown === '')
			{
				continue;
			}

			$transformResult = $mdTransformer->transform($markdown, $docId, $attachmentFileMap);
			$this->documentService->setMarkdown($docId, $transformResult->markdown);
		}

		ImportLogger::logInfo("retryAttachments: {$successCount}/{$retryCount} recovered");
		$option['step'] = 'reconcile';
	}

	/**
	 * @param array<int, array{docId: int|string, attachmentId: mixed}> $failed
	 */
	private function preloadDocuments(array $failed): void
	{
		$docIds = [];
		foreach ($failed as $entry)
		{
			$id = (int)$entry['docId'];
			if ($id > 0)
			{
				$docIds[$id] = true;
			}
		}
		if (empty($docIds))
		{
			return;
		}

		$rows = $this->documentService->findByIds(array_keys($docIds), ['ID', 'MARKDOWN']);
		foreach ($rows as $id => $row)
		{
			$this->docCache[$id] = [
				'markdown' => is_string($row['MARKDOWN']) ? $row['MARKDOWN'] : '',
			];
		}
	}
}
