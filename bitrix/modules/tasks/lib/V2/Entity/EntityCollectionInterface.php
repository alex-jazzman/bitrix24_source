<?php

declare(strict_types=1);

namespace Bitrix\Tasks\V2\Entity;

use Bitrix\Main\Type\Contract\Arrayable;
use Countable;
use IteratorAggregate;

interface EntityCollectionInterface extends IteratorAggregate, Countable, Arrayable
{
	public function __construct(EntityInterface ...$entities);

	public function getIds(): array;

	public static function mapFromArray(array $props): static;
}