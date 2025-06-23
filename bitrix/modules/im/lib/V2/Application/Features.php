<?php

namespace Bitrix\Im\V2\Application;

use Bitrix\Im\Call\Integration\Zoom;
use Bitrix\Im\Integration\Disk\Documents;
use Bitrix\Im\Settings;
use Bitrix\Im\V2\Chat\CopilotChat;
use Bitrix\Im\V2\Integration\Extranet\CollaberService;
use Bitrix\Im\V2\Integration\HumanResources\Structure;
use Bitrix\Im\V2\Integration\Intranet\Invitation;
use Bitrix\Im\V2\Integration\Sign\DocumentSign;
use Bitrix\Im\V2\Integration\Socialnetwork\Collab\Collab;
use Bitrix\ImBot\Bot\Giphy;
use Bitrix\Main\Config\Option;
use Bitrix\Main\Loader;

class Features
{
	private static self $currentFeatures;

	public function __construct(
		public readonly bool $chatV2,
		public readonly bool $chatDepartments,
		public readonly bool $copilotActive,
		public readonly bool $copilotAvailable,
		public readonly bool $sidebarLinks,
		public readonly bool $sidebarFiles,
		public readonly bool $sidebarBriefs,
		public readonly bool $zoomActive,
		public readonly bool $zoomAvailable,
		public readonly bool $openLinesV2,
		public readonly bool $giphyAvailable,
		public readonly bool $collabAvailable,
		public readonly bool $collabCreationAvailable,
		public readonly bool $enabledCollabersInvitation,
		public readonly bool $inviteByPhoneAvailable,
		public readonly bool $inviteByLinkAvailable,
		public readonly bool $documentSignAvailable,
		public readonly bool $intranetInviteAvailable,
		public readonly bool $voteCreationAvailable,
		public readonly bool $messagesAutoDeleteAvailable,
		public readonly bool $copilotInDefaultTabAvailable,
		public readonly bool $messagesAutoDeleteEnabled,
		public readonly bool $isNotificationsStandalone,
		public readonly bool $teamsInStructureAvailable,
		public readonly bool $isDesktopRedirectAvailable,
	){}

	public static function get(): self
	{
		if (!isset(self::$currentFeatures))
		{
			self::$currentFeatures = self::createCurrent();
		}

		return self::$currentFeatures;
	}

	private static function createCurrent(): self
	{
		return new self(
			!Settings::isLegacyChatActivated(),
			Structure::isSyncAvailable(),
			CopilotChat::isActive(),
			CopilotChat::isAvailable(),
			Option::get('im', 'im_link_url_migration', 'N') === 'Y',
			Option::get('im', 'im_link_file_migration', 'N') === 'Y',
			Documents::getResumesOfCallStatus() === Documents::ENABLED,
			Zoom::isActive(),
			Zoom::isAvailable(),
			self::isImOpenLinesV2Available(),
			self::isGiphyAvailable(),
			Collab::isAvailable(),
			Collab::isCreationAvailable(),
			CollaberService::getInstance()->isEnabledCollabersInvitation(),
			self::isInviteByPhoneAvailable(),
			self::isInviteByLinkAvailable(),
			DocumentSign::isAvailable(),
			Invitation::isAvailable(),
			self::isVoteCreationAvailable(),
			self::isMessagesAutoDeleteAvailable(),
			self::isCopilotInDefaultTabAvailable(),
			self::isMessagesAutoDeleteEnabled(),
			self::isNotificationsStandalone(),
			Structure::isTeamsAvailable(),
			self::isDesktopRedirectAvailable(),
		);
	}

	private static function isGiphyAvailable(): bool
	{
		return Loader::includeModule('imbot')
			&& method_exists(Giphy::class, 'isAvailable')
			&& Giphy::isAvailable()
		;
	}

	private static function isInviteByPhoneAvailable(): bool
	{
		return Loader::includeModule("bitrix24")
			&& Option::get('bitrix24', 'phone_invite_allowed', 'N') === 'Y'
		;
	}

	private static function isInviteByLinkAvailable(): bool
	{
		return true;
	}

	private static function isImOpenLinesV2Available(): bool
	{
		if (Loader::includeModule('imopenlines'))
		{
			return \Bitrix\ImOpenLines\V2\Settings\Settings::isV2Available();
		}

		return false;
	}

	private static function isVoteCreationAvailable(): bool
	{
		return Loader::includeModule('vote')
			&& class_exists('\\Bitrix\\Vote\\Config\\Feature')
			&& \Bitrix\Vote\Config\Feature::instance()->isImIntegrationEnabled()
		;
	}

	public static function isMessagesAutoDeleteAvailable(): bool
	{
		return Option::get('im', 'auto_delete_messages_activated', 'N') === 'Y';
	}

	public static function isCopilotInDefaultTabAvailable(): bool
	{
		if (!CopilotChat::isActive() || !CopilotChat::isAvailable())
		{
			return false;
		}

		return \Bitrix\Main\Config\Option::get('im', 'copilot_in_default_tab_activated', 'N') === 'Y';
	}

	private static function isNotificationsStandalone(): bool
	{
		return Option::get('im', '~is_notifications_standalone', 'N') === 'Y';
	}

	public static function isMessagesAutoDeleteEnabled(): bool
	{
		return Option::get('im', 'isAutoDeleteMessagesEnabled', 'Y') === 'Y';
	}

	public static function isDesktopRedirectAvailable(): bool
	{
		return Option::get('im', 'desktop_redirect_available', 'N') === 'Y';
	}
}
