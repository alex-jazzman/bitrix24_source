<?php

declare(strict_types=1);

namespace Bitrix\Note\Public\Command;

use Bitrix\Main\Command\AbstractCommand;
use Bitrix\Main\Result;
use Bitrix\Note\Internal\Service\Collection\CollectionService;

class CreateCollectionCommand extends AbstractCommand
{
	private readonly string $name;
	private readonly int $createdBy;
	private readonly int $position;
	private readonly CollectionService $collectionService;

	public function __construct(
		string $name,
		int $createdBy,
		int $position = 0,
		?CollectionService $collectionService = null,
	)
	{
		$this->name = $name;
		$this->createdBy = $createdBy;
		$this->position = $position;
		$this->collectionService = $collectionService ?? new CollectionService();
	}

	protected function execute(): Result
	{
		$collection = $this->collectionService->create($this->name, $this->createdBy, $this->position);

		$result = new Result();
		$result->setData(['collection' => $collection]);

		return $result;
	}
}
