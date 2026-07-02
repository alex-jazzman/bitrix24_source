<?php

declare(strict_types=1);

namespace Bitrix\Note\Public\Command\Import;

use Bitrix\Main\Result;

class ProcessImportStepResult extends Result
{
	private array $option;
	private int $doneCount;
	private bool $shouldContinue;

	public function __construct(array $option, int $doneCount, bool $shouldContinue)
	{
		parent::__construct();
		$this->option = $option;
		$this->doneCount = $doneCount;
		$this->shouldContinue = $shouldContinue;
	}

	public function getOption(): array
	{
		return $this->option;
	}

	public function getDoneCount(): int
	{
		return $this->doneCount;
	}

	public function shouldContinue(): bool
	{
		return $this->shouldContinue;
	}
}
