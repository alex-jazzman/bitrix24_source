<?php

namespace Bitrix\Mobile\Controller;

use Bitrix\Extranet\PortalSettings;
use Bitrix\Main\Engine\ActionFilter\CloseSession;
use Bitrix\Main\LoaderException;
use Bitrix\Mobile\Collab\ActionFilter\CollabAccessControl;
use Bitrix\Mobile\Collab\Dto\CollabPermissionSettingsDto;
use Bitrix\Mobile\Collab\Dto\CollabSecuritySettingsDto;
use Bitrix\Mobile\Collab\Dto\CollabSettingsUserDto;
use Bitrix\Main\Engine\JsonController;
use Bitrix\Main\Loader;
use Bitrix\Mobile\Collab\Dto\CollabTaskPermissionsSettingsDto;
use Bitrix\Mobile\Trait\PublicErrorsTrait;
use Bitrix\Intranet\Service\InviteLinkGenerator;
use Bitrix\SocialNetwork\Collab\Access\CollabAccessController;
use Bitrix\SocialNetwork\Collab\Access\CollabDictionary;
use Bitrix\Intranet\Settings\Tools\ToolsManager;
use Bitrix\Main\Config\Option;

final class Collab extends JsonController
{
	use PublicErrorsTrait;

	public function configureActions(): array
	{
		$actions = [];

		foreach ($this->getQueryActionNames() as $queryActionName)
		{
			$actions[$queryActionName] = [
				'+prefilters' => [
					new CloseSession(),
				],
			];
		}

		return $actions;
	}

	protected function getQueryActionNames(): array
	{
		return [
			'getInviteSettings',
			'getCreateSettings',
			'getIsCollabNameExistsStatus',
		];
	}

	protected function getDefaultPreFilters(): array
	{
		$preFilters = parent::getDefaultPreFilters();
		$preFilters[] = new CollabAccessControl();

		return $preFilters;
	}

	protected function init()
	{
		parent::init();

		Loader::requireModule('socialnetwork');
		Loader::requireModule('im');
	}

	/**
	 * @restMethod mobile.Collab.getInviteSettings
	 * @return array
	 * @throws LoaderException
	 */
	public function getInviteSettingsAction(int $collabId): array
	{
		if (!$this->isCollabToolEnabled())
		{
			return [
				'canCurrentUserInvite' => false,
				'inviteLink' => null,
				'isBitrix24Included' => false,
				'canInviteCollabers' => false,
			];
		}

		$canCurrentUserInvite = CollabAccessController::can($this->getCurrentUser()->getId(), CollabDictionary::INVITE, $collabId);
		$isBitrix24Included = Loader::includeModule('bitrix24');
		$inviteLink = null;
		if ($canCurrentUserInvite && $isBitrix24Included)
		{
			$linkGenerator = InviteLinkGenerator::createByCollabId($collabId);
			$inviteLink = empty($linkGenerator) ? '' : $linkGenerator->getShortCollabLink();
		}

		$canInviteCollabers = false;
		if (Loader::includeModule('extranet'))
		{
			$canInviteCollabers = PortalSettings::getInstance()->isEnabledCollabersInvitation();
		}

		return [
			'canCurrentUserInvite' => $canCurrentUserInvite,
			'inviteLink' => $inviteLink,
			'isBitrix24Included' => $isBitrix24Included,
			'canInviteCollabers' => $canInviteCollabers,
		];
	}

	/**
	 * @restMethod mobile.Collab.getCreateSettings
	 * @return array
	 * @throws LoaderException
	 */
	public function getCreateSettingsAction(): array
	{
		$result = [
			'permissions' => null,
			'taskPermissions' => null,
			'autoDeleteEnabledInPortalSettings' => null,
			'autoDeleteFeatureAvailable' => null,
			'security' => new CollabSecuritySettingsDto(),
		];

		if (!$this->isCollabToolEnabled())
		{
			return $result;
		}

		$user = $this->getCurrentUser();

		if ($user)
		{
			$result['permissions'] = new CollabPermissionSettingsDto(
				$owner = new CollabSettingsUserDto(
					$user->getId(),
					$user->getFirstName(),
					$user->getLastName(),
					$user->getFullName(),
				),
				$moderators = [],
			);
			$result['taskPermissions'] = new CollabTaskPermissionsSettingsDto();
			$result['autoDeleteEnabledInPortalSettings'] = Option::get('im', 'isAutoDeleteMessagesEnabled', 'Y') === 'Y';
			$result['autoDeleteFeatureAvailable'] = Option::get('im', 'auto_delete_messages_activated', 'N') === 'Y';
		}

		return $result;
	}

	/**
	 * @restMethod mobile.Collab.getIsCollabNameExistsStatus
	 * @return array
	 * @throws LoaderException
	 */
	public function getIsCollabNameExistsStatusAction(string $name): array
	{
		if (!$this->isCollabToolEnabled())
		{
			return [];
		}

		return [
			'isExists' => \Bitrix\Socialnetwork\Provider\GroupProvider::getInstance()->isExistingGroup($name),
			'name' => $name,
		];
	}

	/**
	 * @throws LoaderException
	 */
	public function isCollabToolEnabledAction(): array
	{
		return [
			'isCollabToolEnabled' => $this->isCollabToolEnabled(),
		];
	}

	/**
	 * @return bool
	 * @throws LoaderException
	 */
	private function isCollabToolEnabled(): bool
	{
		if (Loader::includeModule('intranet'))
		{
			return ToolsManager::getInstance()->checkAvailabilityByToolId('collab');
		}

		return true;
	}
}
