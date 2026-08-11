<?php

declare(strict_types=1);

namespace Bitrix\Note\Internal\Service\Mention\Resolver;

use Bitrix\Main\Engine\CurrentUser;
use Bitrix\Note\Internal\Integration\Tasks\TaskMentionGateway;
use Bitrix\Note\Internal\Mention\MentionType;
use Bitrix\Note\Internal\Service\Mention\MentionEntityResolver;
use Bitrix\Note\Internal\Service\Mention\ResolvedMention;

final class TaskMentionResolver implements MentionEntityResolver
{
	public function resolve(array $ids): array
	{
		$userId = (int)CurrentUser::get()->getId();

		$normalizedIds = array_values(array_filter(array_map('intval', $ids), static fn(int $i): bool => $i > 0));

		$tasks = (new TaskMentionGateway())->resolveBatch($normalizedIds, $userId);

		$result = [];
		foreach ($ids as $id)
		{
			$id = (int)$id;
			$task = $tasks[$id] ?? null;

			if ($task === null || !$task->exists)
			{
				$result[$id] = ResolvedMention::unavailable(MentionType::Task->value, $id, 'deleted');
				continue;
			}

			if (!$task->accessible)
			{
				$result[$id] = ResolvedMention::unavailable(MentionType::Task->value, $id, 'no_access');
				continue;
			}

			$result[$id] = ResolvedMention::available(
				type: MentionType::Task->value,
				id: $id,
				label: (string)$task->title,
				url: $task->url,
			);
		}

		return $result;
	}
}
