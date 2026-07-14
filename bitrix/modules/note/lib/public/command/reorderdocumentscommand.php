<?php

declare(strict_types=1);

namespace Bitrix\Note\Public\Command;

use Bitrix\Main\Command\AbstractCommand;
use Bitrix\Main\Result;
use Bitrix\Main\SystemException;
use Bitrix\Note\Internal\Service\Document\Position\PositionService;

final class ReorderDocumentsCommand extends AbstractCommand
{
	private readonly int $collectionId;
	private readonly array $ids;
	private readonly int $userId;
	private readonly ?int $parentId;
	private readonly PositionService $positionService;

	public function __construct(
		int $collectionId,
		array $ids,
		int $userId,
		?int $parentId = null,
		?PositionService $positionService = null
	)
	{
		$this->collectionId = $collectionId;
		$this->ids = $ids;
		$this->userId = $userId;
		$this->parentId = $parentId;
		$this->positionService = $positionService ?? new PositionService();
	}

	protected function execute(): Result
	{
		$result = $this->positionService->reorder($this->collectionId, $this->parentId, $this->ids, $this->userId);
		if (!$result->isSuccess())
		{
			throw new SystemException($this->buildErrorMessage($result, 'Unable to reorder documents.'));
		}

		return $this->createResult();
	}

	private function createResult(array $data = []): Result
	{
		$result = new Result();
		if (!empty($data))
		{
			$result->setData($data);
		}

		return $result;
	}

	private function buildErrorMessage(Result $result, string $defaultMessage): string
	{
		$messages = $result->getErrorMessages();

		return empty($messages) ? $defaultMessage : implode(', ', $messages);
	}
}
