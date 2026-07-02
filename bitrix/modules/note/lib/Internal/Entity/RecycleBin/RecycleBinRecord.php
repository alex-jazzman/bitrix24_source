<?php

declare(strict_types=1);

namespace Bitrix\Note\Internal\Entity\RecycleBin;

use Bitrix\Main\Entity\EntityInterface;
use Bitrix\Main\Type\DateTime;
use Bitrix\Note\Internal\Model\RecycleBinTable;

final class RecycleBinRecord implements EntityInterface, \JsonSerializable
{
	public function __construct(
		private readonly ?int $id,
		private readonly int $documentId,
		private readonly DateTime $trashedAt,
		private readonly int $trashedBy,
		private readonly string $origin,
	) {}

	public function getId(): ?int
	{
		return $this->id;
	}

	public function getDocumentId(): int
	{
		return $this->documentId;
	}

	public function getTrashedAt(): DateTime
	{
		return $this->trashedAt;
	}

	public function getTrashedBy(): int
	{
		return $this->trashedBy;
	}

	public function getOrigin(): string
	{
		return $this->origin;
	}

	public static function createForUserDelete(int $documentId, int $trashedBy): self
	{
		return new self(null, $documentId, new DateTime(), $trashedBy, RecycleBinTable::ORIGIN_USER_DELETE);
	}

	public static function createForCascadeDocument(int $documentId, int $trashedBy): self
	{
		return new self(null, $documentId, new DateTime(), $trashedBy, RecycleBinTable::ORIGIN_CASCADE_DOCUMENT);
	}

	public static function createForCascadeCollectionDeleted(int $documentId, int $trashedBy): self
	{
		return new self(null, $documentId, new DateTime(), $trashedBy, RecycleBinTable::ORIGIN_CASCADE_COLLECTION_DELETED);
	}

	public function jsonSerialize(): array
	{
		return [
			'id' => $this->id,
			'documentId' => $this->documentId,
			'trashedAt' => $this->trashedAt->format('c'),
			'trashedBy' => $this->trashedBy,
			'origin' => $this->origin,
		];
	}
}
