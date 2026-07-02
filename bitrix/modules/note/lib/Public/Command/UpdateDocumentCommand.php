<?php

declare(strict_types=1);

namespace Bitrix\Note\Public\Command;

use Bitrix\Main\Command\AbstractCommand;
use Bitrix\Main\Result;
use Bitrix\Note\Internal\Exceptions\DocumentArchivedException;
use Bitrix\Note\Internal\Exceptions\DocumentInRecycleBinException;
use Bitrix\Note\Internal\Repository\DocumentRepository;
use Bitrix\Note\Internal\Service\Document\DocumentService;
use Bitrix\Note\Internal\Service\RecycleBin\RecycleBinFilter;

class UpdateDocumentCommand extends AbstractCommand
{
	private readonly DocumentService $documentService;
	private readonly DocumentRepository $repository;
	private readonly RecycleBinFilter $recycleBinFilter;

	public function __construct(
		private readonly int $id,
		private readonly ?string $title,
		private readonly int $userId,
		?DocumentService $documentService = null,
		?DocumentRepository $repository = null,
		?RecycleBinFilter $recycleBinFilter = null,
	)
	{
		$this->documentService = $documentService ?? new DocumentService();
		$this->repository = $repository ?? new DocumentRepository();
		$this->recycleBinFilter = $recycleBinFilter ?? new RecycleBinFilter();
	}

	protected function execute(): Result
	{
		if ($this->recycleBinFilter->isInRecycleBin($this->id))
		{
			throw new DocumentInRecycleBinException();
		}

		$existing = $this->repository->getById($this->id);
		if ($existing !== null && $existing->getIsArchived())
		{
			throw new DocumentArchivedException();
		}

		$document = $this->documentService->update(
			id: $this->id,
			title: $this->title,
			markdown: null,
			userId: $this->userId,
		);

		$result = new Result();
		$result->setData(['document' => $document]);

		return $result;
	}
}
