<?php

declare(strict_types=1);

namespace Bitrix\Tasks\V2\Entity;

use ArrayIterator;
use Bitrix\Main\ArgumentException;
use Bitrix\Main\Validation\Rule\Recursive\Validatable;

/**
 * @method array getIdList()
 */
abstract class AbstractEntityCollection implements EntityCollectionInterface
{
	/** @var EntityInterface[] */
	#[Validatable(iterable: true)]
	protected array $entities = [];

	abstract protected static function getEntityClass(): string;

	public function __construct(EntityInterface ...$entities)
	{
		foreach ($entities as $entity)
		{
			if ($entity::class !== static::getEntityClass())
			{
				throw new ArgumentException();
			}
		}

		$this->entities = $entities;
	}

	public function findOneById(int $id, string $idKey = 'id'): ?EntityInterface
	{
		return $this->findOne([$idKey => $id]);
	}

	public function findAllByIds(array $ids, string $idKey = 'id'): ?static
	{
		return $this->findAll([$idKey => $ids]);
	}

	public function findOne(array $conditions): ?EntityInterface
	{
		foreach ($this as $item)
		{
			foreach ($conditions as $key => $value)
			{
				if (!property_exists($item, $key) || $item->{$key} !== $value)
				{
					continue 2;
				}
			}

			return $item;
		}

		return null;
	}

	public function findAll(array $conditions): static
	{
		$result = [];
		foreach ($this as $item)
		{
			foreach ($conditions as $key => $value)
			{
				if (!property_exists($item, $key))
				{
					continue 2;
				}

				if (is_array($value))
				{
					if (!in_array($item->{$key}, $value, true))
					{
						continue 2;
					}
				}
				elseif ($item->{$key} !== $value)
				{
					continue 2;
				}
			}
			$result[] = $item;
		}

		return new static(...$result);
	}

	public function add(EntityInterface $entity): static
	{
		if ($entity::class !== static::getEntityClass())
		{
			throw new ArgumentException();
		}

		$this->entities[] = $entity;

		return $this;
	}

	public function remove(mixed $id): static
	{
		foreach ($this->entities as $i => $entity)
		{
			if ($entity->getId() === $id)
			{
				unset($this->entities[$i]);
			}
		}

		return $this;
	}

	public function __call(string $name, array $args = []): ?array
	{
		$operation = substr($name, 0, 3);
		$property = lcfirst(substr($name, 3));
		$subOperation = lcfirst(substr($property, -4));

		if ($operation === 'get' && $subOperation === 'list')
		{
			$property = substr($property, 0, -4);

			return array_column($this->toArray(), $property);
		}

		return null;
	}

	public function getIds(): array
	{
		return $this->getIdList();
	}

	public static function mapFromArray(array $props): static
	{
		$entities = [];
		foreach ($props as $prop)
		{
			if (!is_array($prop))
			{
				continue;
			}

			/** @var EntityInterface $itemClass */
			$itemClass = static::getEntityClass();
			$entities[] = $itemClass::mapFromArray($prop);
		}

		return new static(...$entities);
	}

	public static function mapFromIds(array $ids, string $idKey = 'id'): static
	{
		$entities = [];
		foreach ($ids as $id)
		{
			/** @var EntityInterface $itemClass */
			$itemClass = static::getEntityClass();
			if (is_subclass_of($itemClass, AbstractEntity::class))
			{
				$entities[] = $itemClass::mapFromId(id: $id, idKey: $idKey);
			}
			else
			{
				$entities[] = $itemClass::mapFromArray([$idKey => $id]);
			}
		}

		return new static(...$entities);
	}

	public function getIterator(): ArrayIterator
	{
		return new ArrayIterator($this->entities);
	}

	public function toArray(): array
	{
		return array_map(static fn ($collectionItem): array => $collectionItem->toArray(), $this->entities);
	}

	public function diff(self $collectionToCompare): array
	{
		return array_diff($this->getIds(), $collectionToCompare->getIds());
	}

	public function count(): int
	{
		return count($this->entities);
	}

	public function isEmpty(): bool
	{
		return $this->count() === 0;
	}

	public function getFirstEntity(): ?EntityInterface
	{
		if (!$this->count())
		{
			return null;
		}

		return $this->entities[0];
	}

	public function merge(self $collection): static
	{
		foreach ($collection as $item)
		{
			$this->add($item);
		}

		return $this;
	}
}
