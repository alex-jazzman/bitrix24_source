<?php

declare(strict_types=1);

namespace Bitrix\Note\Public\Command;

use Bitrix\Main\Command\AbstractCommand;
use Bitrix\Main\Result;
use Bitrix\Note\Internal\Model\DocumentTable;
use Bitrix\Note\Internal\Service\Document\DocumentService;

class CreateDocumentCommand extends AbstractCommand
{
	private readonly int $collectionId;
	private readonly ?int $parentId;
	private readonly string $title;
	private readonly string $markdown;
	private readonly int $userId;
	private readonly string $contentFormat;
	private readonly DocumentService $documentService;

	public function __construct(
		int $collectionId,
		?int $parentId,
		string $title,
		string $markdown,
		int $userId,
		string $contentFormat = DocumentTable::CONTENT_FORMAT_YJS,
		?DocumentService $documentService = null,
	)
	{
		$this->collectionId = $collectionId;
		$this->parentId = $parentId;
		$this->title = $title;
		$this->markdown = $markdown;
		$this->userId = $userId;
		$this->contentFormat = $contentFormat;
		$this->documentService = $documentService ?? new DocumentService();
	}

	protected function execute(): Result
	{
		$document = $this->documentService->create(
			$this->collectionId,
			$this->parentId,
			$this->title,
			$this->markdown,
			$this->userId,
			$this->contentFormat,
		);

		$result = new Result();
		$result->setData(['document' => $document]);

		return $result;
	}
}
