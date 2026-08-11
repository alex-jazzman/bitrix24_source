<?php

declare(strict_types=1);

namespace Bitrix\Note\Internal\Integration\Tasks;

// One of three states for a requested task id, as seen by the viewer.
final class ResolvedTask
{
	private function __construct(
		public readonly int $id,
		public readonly bool $exists,
		public readonly bool $accessible,
		public readonly ?string $title,
		public readonly ?string $url,
	) {
	}

	public static function deleted(int $id): self
	{
		return new self($id, exists: false, accessible: false, title: null, url: null);
	}

	public static function noAccess(int $id): self
	{
		return new self($id, exists: true, accessible: false, title: null, url: null);
	}

	public static function available(int $id, string $title, string $url): self
	{
		return new self($id, exists: true, accessible: true, title: $title, url: $url);
	}
}
