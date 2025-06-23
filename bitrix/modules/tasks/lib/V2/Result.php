<?php

declare(strict_types=1);

namespace Bitrix\Tasks\V2;

use Bitrix\Tasks\V2\Entity\EntityInterface;

class Result extends \Bitrix\Main\Result
{
	public function setObject(EntityInterface $object): self
	{
		$this->data['object'] = $object;

		return $this;
	}

	public function getObject(): ?EntityInterface
	{
		return $this->data['object'] ?? null;
	}

	public function getDataByKey(string $key): mixed
	{
		return $this->data[$key] ?? null;
	}
}
