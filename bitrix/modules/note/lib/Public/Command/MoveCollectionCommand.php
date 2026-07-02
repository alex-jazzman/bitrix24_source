<?php

declare(strict_types=1);

namespace Bitrix\Note\Public\Command;

use Bitrix\Main\Command\AbstractCommand;
use Bitrix\Main\Result;
use Bitrix\Main\SystemException;
use Bitrix\Note\Internal\Service\Collection\CollectionPositionService;

final class MoveCollectionCommand extends AbstractCommand
{
	private readonly int $id;
	private readonly ?int $position;
	private readonly int $userId;
	private readonly CollectionPositionService $positionService;

	public function __construct(
		int $id,
		?int $position,
		int $userId,
		?CollectionPositionService $positionService = null,
	)
	{
		$this->id = $id;
		$this->position = $position;
		$this->userId = $userId;
		$this->positionService = $positionService ?? new CollectionPositionService();
	}

	protected function execute(): Result
	{
		$result = $this->positionService->move($this->id, $this->position, $this->userId);
		if (!$result->isSuccess())
		{
			throw new SystemException(
				implode(', ', $result->getErrorMessages()) ?: 'Unable to move collection.'
			);
		}

		return $result;
	}
}
