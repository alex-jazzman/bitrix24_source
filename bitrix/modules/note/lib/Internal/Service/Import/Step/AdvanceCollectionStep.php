<?php

declare(strict_types=1);

namespace Bitrix\Note\Internal\Service\Import\Step;

use Bitrix\Note\Internal\Service\Import\Source\SourceInterface;

class AdvanceCollectionStep implements StepInterface
{
	public function execute(array &$option, ?SourceInterface $source): void
	{
		$option['globalDoneCount'] = ($option['globalDoneCount'] ?? 0) + ($option['doneCount'] ?? 0);
		$option['globalErrorCount'] = ($option['globalErrorCount'] ?? 0) + ($option['errorCount'] ?? 0);
		$option['globalTotalAttachments'] = ($option['globalTotalAttachments'] ?? 0) + ($option['totalAttachments'] ?? 0);
		$option['globalDoneAttachments'] = ($option['globalDoneAttachments'] ?? 0) + ($option['doneAttachments'] ?? 0);

		$option['collectionIndex'] = ($option['collectionIndex'] ?? 0) + 1;
		$option['step'] = 'createCollection';
		$option['resultCollectionId'] = null;
		$option['importedDocIds'] = [];
		$option['attachmentDocIndex'] = 0;
		$option['attachmentFileIndex'] = 0;
		$option['totalItems'] = 0;
		$option['doneCount'] = 0;
		$option['errorCount'] = 0;
		$option['totalAttachments'] = 0;
		$option['doneAttachments'] = 0;
		$option['documentOffset'] = 0;
		unset($option['structureQueue'], $option['structureIndex'], $option['failedAttachments']);
	}
}
