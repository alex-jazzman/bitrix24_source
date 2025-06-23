<?php

declare(strict_types=1);

namespace Bitrix\Tasks\V2\Entity;

use Bitrix\Main\Validation\Rule\PositiveNumber;
use Bitrix\Tasks\V2\Entity\User\Gender;

class User extends AbstractEntity
{
	public function __construct(
		#[PositiveNumber]
		public readonly ?int $id = null,
		public readonly ?string $name = null,
		public readonly ?string $role = null, // role depends on context
		public readonly ?string $image = null,
		public readonly ?Gender $gender = null,
	)
	{

	}

	public function getId(): ?int
	{
		return $this->id;
	}

	public static function mapFromArray(array $props): static
	{
		return new static(
			id: $props['id'] ?? null,
			name: $props['name'] ?? null,
			role: $props['role'] ?? null,
			image: $props['image'] ?? null,
			gender: Gender::tryFrom($props['gender'] ?? 'M'),
		);
	}

	public function getGender(): Gender
	{
		return $this->gender ?? Gender::Male;
	}

	public function toArray(): array
	{
		return [
			'id' => $this->id,
			'name' => $this->name,
			'role' => $this->role,
			'image' => $this->image,
			'gender' => $this->gender?->value,
		];
	}
}
