<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Main;
use Bitrix\Main\Localization\Loc;
use Bitrix\Note\Internal\Access\AccessController;
use Bitrix\Note\Internal\Access\ActionDictionary;
use Bitrix\Note\Internal\Access\Component\PermissionConfig;
use Bitrix\Note\Internal\Service\License\LicenseService;

Main\Loader::requireModule('note');

class NoteConfigPermissionsComponent extends CBitrixComponent
{
	public function executeComponent(): void
	{
		global $APPLICATION;
		/** @var CMain $APPLICATION */

		// Tariff/tool blocking no longer short-circuits the entry: we always mount the
		// permissions interface (once ACL passes) and open the tariff slider on top of it.
		$blockSliderCode = $this->createLicenseService()->resolveBlockingSliderCode();

		if (!$this->checkAccessPermissions())
		{
			$this->showError(Loc::getMessage('NOTE_CONFIG_PERMISSIONS_WRONG_PERMISSION'));

			return;
		}

		$isSetTitle = ($this->arParams['SET_TITLE'] ?? 'Y') === 'Y';
		if ($isSetTitle)
		{
			$APPLICATION->SetTitle(Loc::getMessage('NOTE_CONFIG_PERMISSIONS_TITLE'));
		}

		$this->initResult();
		// Non-null when the tariff/tool blocks access: the template opens the
		// corresponding slider on top of the mounted interface.
		$this->arResult['TARIFF_SLIDER_CODE'] = $blockSliderCode;
		$this->renderTemplate();
	}

	private function initResult(): void
	{
		$data = $this->loadData();

		$this->arResult['ACTION_URI'] = $this->getPath() . '/ajax.php';
		$this->arResult['NAME'] = Loc::getMessage('NOTE_CONFIG_PERMISSIONS_NAME');
		$this->arResult['USER_GROUPS'] = $data['USER_GROUPS'];
		$this->arResult['ACCESS_RIGHTS'] = $data['ACCESS_RIGHTS'];
	}

	/**
	 * @return array{USER_GROUPS: array, ACCESS_RIGHTS: array}
	 */
	private function loadData(): array
	{
		$configPermissions = new PermissionConfig();

		return [
			'USER_GROUPS' => $configPermissions->getUserGroups(),
			'ACCESS_RIGHTS' => $configPermissions->getAccessRights(),
		];
	}

	protected function createLicenseService(): LicenseService
	{
		return new LicenseService();
	}

	// Seam for unit tests: CBitrixComponent::includeComponentTemplate() is final.
	protected function renderTemplate(): void
	{
		$this->includeComponentTemplate();
	}

	private function checkAccessPermissions(): bool
	{
		return AccessController::getCurrent()->check(ActionDictionary::ACTION_NOTE_EDIT_PERMISSIONS);
	}

	private function showError(string $message): void
	{
		\Bitrix\UI\Toolbar\Facade\Toolbar::deleteFavoriteStar();

		global $APPLICATION;
		/** @var CMain $APPLICATION */

		$APPLICATION->IncludeComponent(
			'bitrix:ui.info.error',
			'',
			['TITLE' => $message],
		);
	}
}
