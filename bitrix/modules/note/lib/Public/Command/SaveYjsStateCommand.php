<?php

declare(strict_types=1);

namespace Bitrix\Note\Public\Command;

use Bitrix\Main\Command\AbstractCommand;
use Bitrix\Main\Result;
use Bitrix\Main\SystemException;
use Bitrix\Note\Internal\Exceptions\DocumentArchivedException;
use Bitrix\Note\Internal\Exceptions\DocumentInRecycleBinException;
use Bitrix\Note\Internal\Model\DocumentTable;
use Bitrix\Note\Internal\Repository\DocumentRepository;
use Bitrix\Note\Internal\Service\RecycleBin\RecycleBinFilter;

class SaveYjsStateCommand extends AbstractCommand
{
	private readonly int $documentId;
	private readonly int $userId;
	private readonly string $yjsState;
	private readonly DocumentRepository $documentRepository;
	private readonly RecycleBinFilter $recycleBinFilter;

	public function __construct(
		int $documentId,
		int $userId,
		string $yjsState,
		?DocumentRepository $documentRepository = null,
		?RecycleBinFilter $recycleBinFilter = null,
	)
	{
		$this->documentId = $documentId;
		$this->userId = $userId;
		$this->yjsState = $yjsState;
		$this->documentRepository = $documentRepository ?? new DocumentRepository();
		$this->recycleBinFilter = $recycleBinFilter ?? new RecycleBinFilter();
	}

	protected function execute(): Result
	{
		if ($this->recycleBinFilter->isInRecycleBin($this->documentId))
		{
			throw new DocumentInRecycleBinException();
		}

		$document = $this->documentRepository->getMetaById($this->documentId, ['ID', 'UPDATED_AT', 'CONTENT_FORMAT', 'IS_ARCHIVED']);
		if ($document === null)
		{
			throw new SystemException('Document not found');
		}

		if ($document->getIsArchived())
		{
			throw new DocumentArchivedException();
		}

		$document->setYjsState($this->yjsState);
		$document->setUpdatedBy($this->userId);
		if ($document->getContentFormat() !== DocumentTable::CONTENT_FORMAT_YJS)
		{
			$document->setContentFormat(DocumentTable::CONTENT_FORMAT_YJS);
		}
		$saveResult = $this->documentRepository->save($document);

		if (!$saveResult->isSuccess())
		{
			$result = new Result();
			$result->addErrors($saveResult->getErrors());

			return $result;
		}

		return new Result();
	}
}
