<?php

declare(strict_types=1);

namespace Bitrix\Note\Internal\Service;

use Bitrix\Main\Engine\UrlManager;

class NoteFileUrlService
{
	public static function createShowUrl(int $fileId): string
	{
		if ($fileId <= 0)
		{
			return '';
		}

		$uri = UrlManager::getInstance()->create(
			'note.infrastructure.FileController.show',
			[
				'fileId' => $fileId,
			],
			false,
		);

		// Always return relative url to avoid mixed-content in https contexts.
		return $uri->getPathQuery();
	}
}
