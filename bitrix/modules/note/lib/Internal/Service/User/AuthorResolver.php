<?php

declare(strict_types=1);

namespace Bitrix\Note\Internal\Service\User;

use Bitrix\Main\UserTable;
use CFile;
use CSite;
use CUser;

/**
 * Batch-resolves author meta (id, name, photoUrl) for a list of user ids.
 * Returns associative array keyed by id with stable shape.
 */
final class AuthorResolver
{
	private const PHOTO_SIZE = 40;

	/**
	 * @param int[] $userIds
	 * @return array<int, array{id: int, name: string, photoUrl: ?string, isSystem?: true}>
	 */
	public function resolve(array $userIds): array
	{
		$ids = array_values(array_unique(array_map(static fn($id): int => (int)$id, $userIds)));

		$result = [];
		$realIds = [];
		foreach ($ids as $id)
		{
			if (SystemUser::isSystem($id))
			{
				$result[SystemUser::ID] = SystemUser::asAuthorMeta();
			}
			elseif ($id > 0)
			{
				$realIds[] = $id;
			}
		}

		if ($realIds === [])
		{
			return $result;
		}

		$rows = UserTable::query()
			->setSelect([
				'ID',
				'NAME',
				'LAST_NAME',
				'SECOND_NAME',
				'LOGIN',
				'TITLE',
				'EMAIL',
				'PERSONAL_PHOTO',
			])
			->whereIn('ID', $realIds)
			->fetchAll()
		;

		$nameFormat = CSite::GetNameFormat();
		foreach ($rows as $row)
		{
			$id = (int)$row['ID'];
			$result[$id] = [
				'id' => $id,
				'name' => CUser::FormatName($nameFormat, $row, true, false),
				'photoUrl' => $this->resolvePhotoUrl((int)($row['PERSONAL_PHOTO'] ?? 0)),
			];
		}

		return $result;
	}

	private function resolvePhotoUrl(int $fileId): ?string
	{
		if ($fileId <= 0)
		{
			return null;
		}

		$resized = CFile::ResizeImageGet(
			$fileId,
			['width' => self::PHOTO_SIZE, 'height' => self::PHOTO_SIZE],
			BX_RESIZE_IMAGE_PROPORTIONAL,
			false,
		);

		$src = $resized['src'] ?? null;

		return is_string($src) && $src !== '' ? $src : null;
	}
}
