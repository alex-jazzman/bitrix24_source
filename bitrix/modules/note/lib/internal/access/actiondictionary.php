<?php

declare(strict_types=1);

namespace Bitrix\Note\Internal\Access;

use Bitrix\Note\Internal\Access\Permission\PermissionDictionary;

final class ActionDictionary
{
	public const PREFIX = 'note_';

	public const ACTION_NOTE_ACCESS = 'note_access';
	public const ACTION_NOTE_EDIT_PERMISSIONS = 'note_edit_permissions';
	public const ACTION_NOTE_CREATE_COLLECTIONS = 'note_create_collections';
	public const ACTION_NOTE_IMPORT = 'note_import';

	public static function getActionPermissionMap(): array
	{
		return [
			self::ACTION_NOTE_ACCESS => PermissionDictionary::NOTE_ACCESS,
			self::ACTION_NOTE_EDIT_PERMISSIONS => PermissionDictionary::NOTE_EDIT_PERMISSIONS,
			self::ACTION_NOTE_CREATE_COLLECTIONS => PermissionDictionary::NOTE_CREATE_COLLECTIONS,
			self::ACTION_NOTE_IMPORT => PermissionDictionary::NOTE_IMPORT,
		];
	}
}
