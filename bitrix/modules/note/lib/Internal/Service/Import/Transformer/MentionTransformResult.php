<?php

declare(strict_types=1);

namespace Bitrix\Note\Internal\Service\Import\Transformer;

class MentionTransformResult
{
	/**
	 * @param string $markdown Transformed markdown
	 * @param string[] $unresolvedIds External IDs that could not be resolved
	 */
	public function __construct(
		public readonly string $markdown,
		public readonly array $unresolvedIds,
	)
	{
	}
}
