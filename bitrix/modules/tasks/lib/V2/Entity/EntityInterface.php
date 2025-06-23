<?php

declare(strict_types=1);

namespace Bitrix\Tasks\V2\Entity;

use Bitrix\Main\Type\Contract\Arrayable;

interface EntityInterface extends Arrayable
{
	public function getId(): mixed;

	public static function mapFromArray(array $props): static;
}
