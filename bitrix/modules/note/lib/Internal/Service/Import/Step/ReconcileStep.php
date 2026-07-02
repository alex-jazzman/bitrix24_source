<?php

declare(strict_types=1);

namespace Bitrix\Note\Internal\Service\Import\Step;

use Bitrix\Note\Internal\Service\Document\DocumentService;
use Bitrix\Note\Internal\Service\Import\ImportLogger;
use Bitrix\Note\Internal\Service\Import\MentionReconciler;
use Bitrix\Note\Internal\Service\Import\Source\SourceInterface;
use Bitrix\Note\Internal\Service\Import\UnresolvedMentionService;

class ReconcileStep implements StepInterface
{
	public function __construct(
		private readonly UnresolvedMentionService $unresolvedMentionService,
		private readonly DocumentService $documentService,
	)
	{
	}

	public function execute(array &$option, ?SourceInterface $source): void
	{
		$reconciler = new MentionReconciler(
			$this->unresolvedMentionService,
			$this->documentService,
			$option['sourceUrl'],
		);

		$resolved = 0;
		$iteration = 0;
		$maxIterations = 1000;

		do
		{
			$batchResolved = $reconciler->reconcile($option['sourceType']);
			$resolved += $batchResolved;
			$iteration++;

			if ($iteration >= $maxIterations)
			{
				ImportLogger::logError("reconcile: exceeded max iterations ({$maxIterations}), resolved so far: {$resolved}");

				break;
			}
		}
		while ($batchResolved > 0);

		ImportLogger::logInfo("reconcile: resolved {$resolved} mentions in {$iteration} iterations");

		$option['step'] = 'nextCollection';
	}
}
