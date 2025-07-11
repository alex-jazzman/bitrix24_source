<?php

namespace Bitrix\ImMobile;

use Bitrix\Im\V2\Application\Features;

class Settings
{
	public static function isBetaAvailable(): bool
	{
		return \Bitrix\Main\Config\Option::get('immobile', 'beta_available', 'N') === 'Y';
	}

	public static function isChatM1Enabled(): bool
	{
		return !self::isLegacyChatEnabled();
	}

	public static function isLegacyChatEnabled(): bool
	{
		if (\Bitrix\Main\Config\Option::get('immobile', 'legacy_chat_enabled', 'N') === 'Y')
		{
			return true;
		}

		if (\CUserOptions::GetOption('immobile', 'legacy_chat_user_enabled', 'N') === 'Y')
		{
			return true;
		}

		return false;
	}

	public static function getSidebarV2Features(): array
	{
		$option = fn(string $name): bool => \Bitrix\Main\Config\Option::get('immobile', $name, 'N') === 'Y';

		return [
			'directChatSidebar' => $option('sidebar_v2_direct_chat_enabled'),
			'groupChatSidebar' => $option('sidebar_v2_group_chat_enabled'),
			'collabSidebar' => $option('sidebar_v2_collab_enabled'),
			'channelSidebar' => $option('sidebar_v2_channel_enabled'),
			'copilotSidebar' => $option('sidebar_v2_copilot_enabled'),
			'commentsSidebar' => $option('sidebar_v2_comments_enabled'),
			'notesSidebar' => $option('sidebar_v2_notes_enabled'),
		];
	}

	public static function isChatLocalStorageAvailable(): bool
	{
		if (!self::isChatM1Enabled())
		{
			return false;
		}

		$isChatLocalStorageAvailable = \Bitrix\Main\Config\Option::get('immobile', 'chat_local_storage_available', 'Y') === 'Y';
		if (!$isChatLocalStorageAvailable)
		{
			return false;
		}

		if (!self::isSyncServiceEnabled())
		{
			return false;
		}

		return true;
	}

	public static function isSyncServiceEnabled(): bool
	{
		if (!\Bitrix\Main\Loader::includeModule('im'))
		{
			return false;
		}

		return \Bitrix\Im\V2\Sync\SyncService::isEnable();
	}

	public static function shouldShowChatV2UpdateHint(): bool
	{
		return \Bitrix\Main\Config\Option::get('immobile', 'should_show_chat_m1_update_hint', 'Y') === 'Y';
	}

	public static function planLimits(): ?array
	{
		if (!\Bitrix\Main\Loader::includeModule('im'))
		{
			return null;
		}

		return \Bitrix\Im\V2\TariffLimit\Limit::getInstance()->getRestrictions();
	}

	public static function getImFeatures(): ?Features
	{
		if (!\Bitrix\Main\Loader::includeModule('im'))
		{
			return null;
		}

		return Features::get();
	}

	public static function getMultipleActionMessageLimit(): ?int
	{
		if (!\Bitrix\Main\Loader::includeModule('im'))
		{
			return null;
		}

		return \Bitrix\Im\V2\Message\MessageService::getMultipleActionMessageLimit();
	}
}
