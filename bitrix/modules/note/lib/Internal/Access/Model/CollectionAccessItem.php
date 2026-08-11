<?php

declare(strict_types=1);

namespace Bitrix\Note\Internal\Access\Model;

use Bitrix\Main\Access\AccessibleItem;

final class CollectionAccessItem implements AccessibleItem
{
	private int $id;

	public function __construct(int $id)
	{
		$this->id = $id;
	}

	public function getId(): int
	{
		return $this->id;
	}

	public function getType(): ?string
	{
		return 'collection';
	}

	public static function createFromId(int $id): self
	{
		return new self($id);
	}
}
