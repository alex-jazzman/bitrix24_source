<?php

declare(strict_types=1);

namespace Bitrix\Note\Internal\Integration\Pull;

final class PullSchema
{
	public static function onGetDependentModule(): array
	{
		return [
			'MODULE_ID' => 'note',
			'USE' => [
				'PUBLIC_SECTION',
			],
		];
	}
}
