<?php

declare(strict_types=1);

namespace Bitrix\Note\Internal\Service;

use Bitrix\Main\Error;
use Bitrix\Main\Result;
use Bitrix\Note\Internal\Repository\DocumentFileLinkRepository;
use Bitrix\Note\Internal\Util\IdNormalizer;

class DocumentFileCleanupService
{
	private DocumentFileLinkRepository $linkRepository;
	private DocumentFileService $documentFileService;

	public function __construct(
		?DocumentFileLinkRepository $linkRepository = null,
		?DocumentFileService $documentFileService = null
	)
	{
		$this->linkRepository = $linkRepository ?? new DocumentFileLinkRepository();
		$this->documentFileService = $documentFileService ?? new DocumentFileService();
	}

	public function cleanupByDocumentIds(array $documentIds): Result
	{
		$result = new Result();
		$normalizedDocumentIds = IdNormalizer::normalize($documentIds);
		if (empty($normalizedDocumentIds))
		{
			$result->setData([
				'successFileIds' => [],
				'failedFileIds' => [],
			]);

			return $result;
		}

		$links = $this->linkRepository->getByDocumentIds($normalizedDocumentIds);
		$fileIds = $this->extractFileIds($links);
		if (empty($fileIds))
		{
			$result->setData([
				'successFileIds' => [],
				'failedFileIds' => [],
			]);

			return $result;
		}

		$deleteResult = $this->linkRepository->deleteByDocumentIds($normalizedDocumentIds);
		if (!$deleteResult->isSuccess())
		{
			$result->addErrors($deleteResult->getErrors());
			$result->setData([
				'successFileIds' => [],
				'failedFileIds' => $fileIds,
			]);

			return $result;
		}

		[$successFileIds, $failedFileIds] = $this->deleteFiles($fileIds, $result);
		$result->setData([
			'successFileIds' => $successFileIds,
			'failedFileIds' => $failedFileIds,
		]);

		return $result;
	}

	public function cleanupByDocumentAndFileIds(int $documentId, array $fileIds): Result
	{
		$result = new Result();
		$normalizedFileIds = IdNormalizer::normalize($fileIds);
		if ($documentId <= 0 || empty($normalizedFileIds))
		{
			$result->addError(new Error('Invalid document file cleanup parameters.'));
			$result->setData([
				'successFileIds' => [],
				'failedFileIds' => $normalizedFileIds,
			]);

			return $result;
		}

		$links = $this->linkRepository->getByDocumentAndFileIds($documentId, $normalizedFileIds);
		$linkedFileIds = $this->extractFileIds($links);
		$failedFileIds = array_values(array_diff($normalizedFileIds, $linkedFileIds));

		if (empty($linkedFileIds))
		{
			$result->setData([
				'successFileIds' => [],
				'failedFileIds' => $failedFileIds,
			]);

			return $result;
		}

		$deleteResult = $this->linkRepository->deleteByDocumentAndFileIds($documentId, $linkedFileIds);
		if (!$deleteResult->isSuccess())
		{
			$result->addErrors($deleteResult->getErrors());
			$result->setData([
				'successFileIds' => [],
				'failedFileIds' => array_values(array_unique(array_merge($failedFileIds, $linkedFileIds))),
			]);

			return $result;
		}

		[$successFileIds, $deleteFailedFileIds] = $this->deleteFiles($linkedFileIds, $result);
		$result->setData([
			'successFileIds' => $successFileIds,
			'failedFileIds' => array_values(array_unique(array_merge($failedFileIds, $deleteFailedFileIds))),
		]);

		return $result;
	}

	private function deleteFiles(array $fileIds, Result $result): array
	{
		$successFileIds = [];
		$failedFileIds = [];

		$normalizedFileIds = IdNormalizer::normalize($fileIds);
		$validFileIdsMap = array_fill_keys(
			$this->documentFileService->getValidatedNoteFileIds($normalizedFileIds),
			true,
		);

		foreach ($normalizedFileIds as $fileId)
		{
			try
			{
				if (!isset($validFileIdsMap[$fileId]))
				{
					$failedFileIds[] = $fileId;

					continue;
				}

				\CFile::Delete($fileId);
				$successFileIds[] = $fileId;
			}
			catch (\Throwable $exception)
			{
				$failedFileIds[] = $fileId;
				$result->addError(new Error($exception->getMessage()));
			}
		}

		return [
			$successFileIds,
			$failedFileIds,
		];
	}

	private function extractFileIds(array $links): array
	{
		$fileIds = [];
		foreach ($links as $link)
		{
			$fileIds[] = (int)($link['FILE_ID'] ?? 0);
		}

		return IdNormalizer::normalize($fileIds);
	}

}
