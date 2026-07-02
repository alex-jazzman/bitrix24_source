<?php

declare(strict_types=1);

namespace Bitrix\Note\Internal\Service\Import;

use Bitrix\Note\Internal\Repository\ImportMapRepository;
use Bitrix\Note\Internal\Service\Collection\CollectionService;
use Bitrix\Note\Internal\Service\Document\DocumentService;
use Bitrix\Note\Internal\Service\Document\Position\PositionService;
use Bitrix\Note\Internal\Service\Import\Source\SourceInterface;
use Bitrix\Note\Internal\Service\Import\Step\AdvanceCollectionStep;
use Bitrix\Note\Internal\Service\Import\Step\CreateCollectionStep;
use Bitrix\Note\Internal\Service\Import\Step\CreateStructureStep;
use Bitrix\Note\Internal\Service\Import\Step\DownloadAttachmentsStep;
use Bitrix\Note\Internal\Service\Import\Step\FillContentStep;
use Bitrix\Note\Internal\Service\Import\Step\ReconcileStep;
use Bitrix\Note\Internal\Service\Import\Step\RetryAttachmentsStep;
use Bitrix\Note\Internal\Service\Import\Step\StepInterface;

class ImportService
{
	/** @var array<string, StepInterface> */
	private array $steps;

	public function __construct(
		?ImportFileService $fileService = null,
		?ImportMapRepository $mapRepository = null,
		?DocumentService $documentService = null,
		?CollectionService $collectionService = null,
		?UnresolvedMentionService $unresolvedMentionService = null,
		?PositionService $positionService = null,
	)
	{
		$fileService = $fileService ?? new ImportFileService();
		$mapRepository = $mapRepository ?? new ImportMapRepository();
		$documentService = $documentService ?? new DocumentService();
		$collectionService = $collectionService ?? new CollectionService();
		$unresolvedMentionService = $unresolvedMentionService ?? new UnresolvedMentionService();
		$positionService = $positionService ?? new PositionService();

		$this->steps = [
			'createCollection' => new CreateCollectionStep($collectionService, $mapRepository),
			'createStructure' => new CreateStructureStep($documentService, $positionService, $mapRepository),
			'fillContent' => new FillContentStep($documentService, $unresolvedMentionService, $mapRepository),
			'downloadAttachments' => new DownloadAttachmentsStep($documentService, $fileService),
			'retryAttachments' => new RetryAttachmentsStep($documentService, $fileService),
			'reconcile' => new ReconcileStep($unresolvedMentionService, $documentService),
			'nextCollection' => new AdvanceCollectionStep(),
		];
	}

	/**
	 * Executes one step of the import process.
	 *
	 * @param array &$option Stepper option, modified by reference
	 * @param SourceInterface $source Source connector
	 * @return bool true = continue, false = finish
	 */
	public function processStep(array &$option, SourceInterface $source): bool
	{
		$collectionIds = array_values($option['collectionIds'] ?? []);
		$option['collectionIds'] = $collectionIds;
		$collectionIndex = $option['collectionIndex'] ?? 0;

		if ($collectionIndex >= count($collectionIds))
		{
			$this->finalize($option);

			return false;
		}

		$step = $option['step'] ?? 'createCollection';

		$handler = $this->steps[$step] ?? null;
		if ($handler === null)
		{
			return false;
		}

		$handler->execute($option, $source);

		if ($step === 'nextCollection')
		{
			$nextCollectionIds = $option['collectionIds'] ?? [];
			$nextIndex = $option['collectionIndex'] ?? 0;
			if ($nextIndex >= count($nextCollectionIds))
			{
				$this->finalize($option);

				return false;
			}
		}

		return true;
	}

	private function finalize(array &$option): void
	{
		$option['globalDoneCount'] = ($option['globalDoneCount'] ?? 0) + ($option['doneCount'] ?? 0);
		$option['globalErrorCount'] = ($option['globalErrorCount'] ?? 0) + ($option['errorCount'] ?? 0);
		$option['globalTotalAttachments'] = ($option['globalTotalAttachments'] ?? 0) + ($option['totalAttachments'] ?? 0);
		$option['globalDoneAttachments'] = ($option['globalDoneAttachments'] ?? 0) + ($option['doneAttachments'] ?? 0);

		$totalDone = $option['globalDoneCount'];
		$option['status'] = $totalDone > 0 ? 'done' : 'error';
	}
}
