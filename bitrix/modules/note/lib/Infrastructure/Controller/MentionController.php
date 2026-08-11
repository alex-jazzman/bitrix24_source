<?php

declare(strict_types=1);

namespace Bitrix\Note\Infrastructure\Controller;

use Bitrix\Main\Engine\ActionFilter\Authentication;
use Bitrix\Main\Engine\ActionFilter\Csrf;
use Bitrix\Main\Engine\Controller;
use Bitrix\Note\Internal\Service\Mention\MentionResolver;

class MentionController extends Controller
{
	// Bound work per request: avatar resizes + per-task ACL checks scale linearly with batch size.
	private const MAX_BATCH_SIZE = 200;
	protected function getDefaultPreFilters(): array
	{
		return array_merge(
			parent::getDefaultPreFilters(),
			[
				new ActionFilter\NoteAccess(),
			],
		);
	}

	public function configureActions(): array
	{
		return [
			'resolveMentionsBatch' => [
				'+prefilters' => [
					new Csrf(),
					new Authentication(),
				],
			],
		];
	}

	/**
	 * Resolves mention metadata for a batch of {type, id} items.
	 * Each input item maps to exactly one output entry; invalid type/id yields available:false, reason:invalid.
	 *
	 * Frontend call: note.infrastructure.MentionController.resolveMentionsBatch
	 */
	public function resolveMentionsBatchAction(array $items = []): array
	{
		$items = array_slice($items, 0, self::MAX_BATCH_SIZE);

		$normalized = [];
		foreach ($items as $raw)
		{
			if (!is_array($raw))
			{
				continue;
			}
			$type = (string)($raw['type'] ?? '');
			$id = (int)($raw['id'] ?? 0);
			// Pass type as-is; dispatcher will emit reason:invalid for unknown types.
			$normalized[] = ['type' => $type, 'id' => $id];
		}

		$resolved = (new MentionResolver())->resolve($normalized);

		return ['mentions' => array_map(static fn($m) => $m->toArray(), $resolved)];
	}
}
