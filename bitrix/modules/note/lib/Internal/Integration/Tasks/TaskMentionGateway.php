<?php

declare(strict_types=1);

namespace Bitrix\Note\Internal\Integration\Tasks;

use Bitrix\Main\Loader;

// Encapsulates all \Bitrix\Tasks\... usage for task mention resolution.
final class TaskMentionGateway
{
	/**
	 * @param int[] $ids
	 * @return array<int, ResolvedTask> map of id => ResolvedTask
	 */
	public function resolveBatch(array $ids, int $userId): array
	{
		if (!Loader::includeModule('tasks'))
		{
			$result = [];
			foreach ($ids as $id)
			{
				$result[$id] = ResolvedTask::noAccess($id);
			}
			return $result;
		}

		if ($ids === [])
		{
			return [];
		}

		$registry = \Bitrix\Tasks\Internals\Registry\TaskRegistry::getInstance();
		// Batch-preload all requested tasks into registry cache to avoid N+1 DB queries.
		// TITLE and GROUP_ID are base fields; withRelations=false is sufficient.
		$registry->load($ids);

		// One access-checked query gives the accessible-id subset in a single round trip,
		// using the same SQL access filter as the tasks entity-selector provider (TaskWithIdProvider).
		$accessibleQuery = (new \Bitrix\Tasks\Provider\Query\TaskQuery($userId))
			->setSelect(['ID'])
			->setWhere(['ID' => $ids])
			->setLimit(count($ids))
		;
		$accessibleTasks = (new \Bitrix\Tasks\Provider\TaskList())->getList($accessibleQuery);
		$accessibleIdSet = array_flip(array_map('intval', array_column($accessibleTasks, 'ID')));

		$result = [];
		foreach ($ids as $id)
		{
			$task = $registry->get($id);

			if ($task === null)
			{
				$result[$id] = ResolvedTask::deleted($id);
				continue;
			}

			if (!isset($accessibleIdSet[$id]))
			{
				$result[$id] = ResolvedTask::noAccess($id);
				continue;
			}

			// TaskPathMaker builds a canonical task URL without user/0 redirect.
			// group_id is passed so group tasks get the workgroup path instead of the personal path.
			$url = \Bitrix\Tasks\Slider\Path\TaskPathMaker::getPath([
				'task_id' => $id,
				'user_id' => $userId,
				'action' => 'view',
				'group_id' => (int)($task['GROUP_ID'] ?? 0),
			]);

			$result[$id] = ResolvedTask::available($id, (string)($task['TITLE'] ?? ''), $url);
		}

		return $result;
	}
}
