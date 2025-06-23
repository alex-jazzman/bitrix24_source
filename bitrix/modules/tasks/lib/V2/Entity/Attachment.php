<?php

declare(strict_types=1);

namespace Bitrix\Tasks\V2\Entity;

class Attachment extends AbstractEntity
{

	public function __construct(
		public readonly ?int $id = null,
		public readonly ?string $name = null,
		public readonly ?int $size = null,
		public readonly ?File $file = null,
		public readonly ?string $downloadUrl = null,
		public readonly ?string $viewUrl = null,
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
			size: $props['size'] ?? null,
			file: isset($props['file']) ? File::mapFromArray($props['file']) : null,
			downloadUrl: $props['downloadUrl'] ?? null,
			viewUrl: $props['viewUrl'] ?? null,
		);
	}

	public function toArray()
	{
		return [
			'id' => $this->id,
			'name' => $this->name,
			'size' => $this->size,
			'file' => $this->file?->toArray(),
			'downloadUrl' => $this->downloadUrl,
			'viewUrl' => $this->viewUrl,
		];
	}
}