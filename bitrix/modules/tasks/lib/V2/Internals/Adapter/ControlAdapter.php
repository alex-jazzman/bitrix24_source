<?php

declare(strict_types=1);

namespace Bitrix\Tasks\V2\Internals\Adapter;

use Bitrix\Main\Engine\Response\Converter;
use Bitrix\Main\Type\Contract\Arrayable;
use Bitrix\Tasks\V2\Entity\EntityInterface;

class ControlAdapter implements AdapterInterface
{
	protected Arrayable $object;

	public function __construct(Arrayable&EntityInterface $object)
	{
		$this->object = $object;
	}

	public function convert(): array
	{
		$converter = new Converter(Converter::KEYS | Converter::RECURSIVE | Converter::TO_SNAKE | Converter::TO_UPPER);

		return $converter->process($this->object->toArray());
	}
}