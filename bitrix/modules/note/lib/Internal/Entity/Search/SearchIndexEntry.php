<?php

declare(strict_types=1);

namespace Bitrix\Note\Internal\Entity\Search;

use Bitrix\Main\Entity\EntityInterface;

final class SearchIndexEntry implements EntityInterface
{
	public function __construct(
		private readonly int $documentId,
		private string $body,
	) {}

	public function getId(): int
	{
		return $this->documentId;
	}

	public function getDocumentId(): int
	{
		return $this->documentId;
	}

	public function getBody(): string
	{
		return $this->body;
	}

	public function setBody(string $body): self
	{
		$this->body = $body;

		return $this;
	}
}
