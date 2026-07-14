<?php

declare(strict_types=1);

namespace Bitrix\Note\Public\Command\Import;

use Bitrix\Main\Command\AbstractCommand;
use Bitrix\Main\Error;
use Bitrix\Main\Result;
use Bitrix\Note\Internal\Service\Import\ImportService;
use Bitrix\Note\Internal\Service\Import\Source\OutlineSource;
use Bitrix\Note\Internal\Service\Import\Source\SourceInterface;
use Bitrix\Note\Internal\Service\Import\Source\WikiSource;

class ProcessImportStepCommand extends AbstractCommand
{
	private array $option;
	private ?ImportService $importService;

	public function __construct(
		array $option,
		?ImportService $importService = null,
	)
	{
		$this->option = $option;
		$this->importService = $importService;
	}

	protected function execute(): Result
	{
		$source = $this->createSource();
		$service = $this->importService ?? new ImportService();

		$shouldContinue = $service->processStep($this->option, $source);

		$doneCount = (int)($this->option['doneCount'] ?? 0);

		return new ProcessImportStepResult($this->option, $doneCount, $shouldContinue);
	}

	private function createSource(): SourceInterface
	{
		$sourceType = $this->option['sourceType'] ?? '';
		$sourceUrl = $this->option['sourceUrl'] ?? '';
		$sourceToken = $this->option['sourceToken'] ?? '';
		$userId = (int)($this->option['userId'] ?? 0);

		return match ($sourceType)
		{
			'outline' => new OutlineSource($sourceUrl, $sourceToken),
			'wiki' => new WikiSource($userId),
			default => throw new \Bitrix\Main\SystemException('Unsupported source type: ' . $sourceType),
		};
	}
}
