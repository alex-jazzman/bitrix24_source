<?php

declare(strict_types=1);

namespace Bitrix\Note\Internal\Service\Mention;

interface MentionEntityResolver
{
	/**
	 * Resolves a batch of entity ids of a single type.
	 *
	 * @param int[] $ids
	 * @return array<int, ResolvedMention> map of id => ResolvedMention
	 */
	public function resolve(array $ids): array;
}
