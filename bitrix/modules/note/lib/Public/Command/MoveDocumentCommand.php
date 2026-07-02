<?php

declare(strict_types=1);

namespace Bitrix\Note\Public\Command;

use Bitrix\Main\Command\AbstractCommand;
use Bitrix\Main\Result;
use Bitrix\Main\SystemException;
use Bitrix\Note\Internal\Exceptions\DocumentArchivedException;
use Bitrix\Note\Internal\Exceptions\DocumentInRecycleBinException;
use Bitrix\Note\Internal\Model\Document;
use Bitrix\Note\Internal\Repository\DocumentRepository;
use Bitrix\Note\Internal\Service\Document\Position\PositionService;
use Bitrix\Note\Internal\Service\RecycleBin\RecycleBinFilter;

class MoveDocumentCommand extends AbstractCommand
{
	private readonly int $id;
	private readonly int $collectionId;
	private readonly ?int $parentId;
	private readonly ?int $position;
	private readonly int $userId;
	private readonly PositionService $positionService;
	private readonly DocumentRepository $repository;
	private readonly RecycleBinFilter $recycleBinFilter;

	public function __construct(
		int $id,
		int $collectionId,
		?int $parentId,
		?int $position,
		int $userId,
		?PositionService $positionService = null,
		?DocumentRepository $repository = null,
		?RecycleBinFilter $recycleBinFilter = null,
	)
	{
		$this->id = $id;
		$this->collectionId = $collectionId;
		$this->parentId = $parentId;
		$this->position = $position;
		$this->userId = $userId;
		$this->positionService = $positionService ?? new PositionService();
		$this->repository = $repository ?? new DocumentRepository();
		$this->recycleBinFilter = $recycleBinFilter ?? new RecycleBinFilter();
	}

	protected function execute(): Result
	{
		if ($this->recycleBinFilter->isInRecycleBin($this->id))
		{
			throw new DocumentInRecycleBinException();
		}

		$document = $this->repository->getById($this->id);
		if ($document !== null && $document->getIsArchived())
		{
			throw new DocumentArchivedException();
		}

		if ($this->parentId !== null)
		{
			if ($this->recycleBinFilter->isInRecycleBin($this->parentId))
			{
				throw new DocumentInRecycleBinException();
			}

			$parent = $this->repository->getById($this->parentId);
			if ($parent !== null && $parent->getIsArchived())
			{
				throw new DocumentArchivedException();
			}
		}

		$result = $this->positionService->move(
			$this->id,
			$this->collectionId,
			$this->parentId,
			$this->position,
			$this->userId,
		);
		if (!$result->isSuccess())
		{
			throw new SystemException($this->buildSaveErrorMessage($result, 'Unable to move document.'));
		}

		$data = $result->getData();
		$document = $data['document'] ?? null;
		if ($document === null)
		{
			return $this->createResult(['document' => null]);
		}

		if (!$document instanceof Document)
		{
			throw new SystemException('Unable to move document.');
		}

		return $this->createResult(['document' => $document]);
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

	private function buildSaveErrorMessage(Result $saveResult, string $defaultMessage): string
	{
		$messages = $saveResult->getErrorMessages();

		return empty($messages) ? $defaultMessage : implode(', ', $messages);
	}
}
