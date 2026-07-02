<?php

declare(strict_types=1);

namespace Bitrix\Note\Public\Command;

use Bitrix\Main\Command\AbstractCommand;
use Bitrix\Main\Result;
use Bitrix\Note\Internal\Service\Collection\CollectionService;

class UpdateCollectionCommand extends AbstractCommand
{
	private readonly int $id;
	private readonly string $name;
	private readonly int $userId;
	private readonly CollectionService $collectionService;

	public function __construct(
		int $id,
		string $name,
		int $userId,
		?CollectionService $collectionService = null,
	)
	{
		$this->id = $id;
		$this->name = $name;
		$this->userId = $userId;
		$this->collectionService = $collectionService ?? new CollectionService();
	}

	protected function execute(): Result
	{
		$collection = $this->collectionService->update($this->id, $this->name, $this->userId);

		$result = new Result();
		$result->setData(['collection' => $collection]);

		return $result;
	}
}
