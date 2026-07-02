<?php

use Bitrix\Intranet\Settings\Tools\ToolsManager;
use Bitrix\Main\Loader;
use Bitrix\Main\Localization\Loc;
use Bitrix\Note\Internal\Access\AccessController;
use Bitrix\Note\Internal\Access\ActionDictionary;
use Bitrix\Main\Engine\CurrentUser;
use Bitrix\Note\Internal\Service\License\LicenseService;
use Bitrix\Note\Internal\Service\Sidebar\DirectOpenContextService;
use Bitrix\Note\Internal\Service\Sidebar\InitialCollectionsService;
use Bitrix\Note\Internal\Service\Sidebar\WelcomeRedirectService;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

class NoteEditorComponent extends CBitrixComponent
{
	private const SIDEBAR_DEFAULT_WIDTH = 280;
	private const SIDEBAR_MIN_WIDTH = 220;
	private const SIDEBAR_MAX_WIDTH = 540;

	private const THEME_LIGHT = 'light';
	private const THEME_DARK = 'dark';
	private const THEME_DEFAULT = self::THEME_LIGHT;

	public function onPrepareComponentParams($arParams): array
	{
		$arParams['DOCUMENT_ID'] = (int)($arParams['DOCUMENT_ID'] ?? 0);
		$arParams['DIRECT_LINK'] = strtoupper((string)($arParams['DIRECT_LINK'] ?? 'N'));
		if ($arParams['DIRECT_LINK'] !== 'Y')
		{
			$arParams['DIRECT_LINK'] = 'N';
		}

		return parent::onPrepareComponentParams($arParams);
	}

	public function executeComponent(): void
	{
		if (!Loader::includeModule('note'))
		{
			$this->arResult = [
				'ERROR' => [
					'TITLE' => (string)Loc::getMessage('NOTE_EDITOR_COMPONENT_MODULE_NOT_INSTALLED'),
				],
			];
			$this->includeComponentTemplate();

			return;
		}

		$licenseService = $this->createLicenseService();
		$blockSliderCode = null;
		if (!$licenseService->isModuleAvailable())
		{
			$blockSliderCode = $licenseService->getAccessSliderCode();
		}
		elseif (!$this->isNoteToolEnabled())
		{
			$blockSliderCode = $licenseService->getToolDisabledSliderCode();
		}
		if ($blockSliderCode !== null)
		{
			$this->arResult = [
				'ERROR' => [
					'REASON' => 'tariff',
					'SLIDER_CODE' => $blockSliderCode,
				],
			];
			$this->renderTariffStub();

			return;
		}

		if (!AccessController::getCurrent()->check(ActionDictionary::ACTION_NOTE_ACCESS))
		{
			$this->arResult = [
				'ERROR' => [
					'TITLE' => (string)Loc::getMessage('NOTE_EDITOR_COMPONENT_ACCESS_DENIED'),
				],
			];
			$this->includeComponentTemplate();

			return;
		}

		$documentId = (int)$this->arParams['DOCUMENT_ID'];
		$directLink = (string)$this->arParams['DIRECT_LINK'];
		$initialSidebarContext = null;
		$initialCollections = (new InitialCollectionsService())->resolve();
		$sidebarOptions = $this->resolveSidebarOptions();
		$welcomeDocumentId = 0;

		if ($directLink === 'Y' && $documentId > 0)
		{
			$initialSidebarContext = (new DirectOpenContextService())->resolve($documentId);
		}
		elseif ($documentId === 0 && $directLink !== 'Y')
		{
			$userId = (int)CurrentUser::get()->getId();
			$resolved = (new WelcomeRedirectService())->resolveFor($userId);
			\CUserOptions::SetOption('note', 'has_visited', 'Y');

			if ($resolved !== null)
			{
				$initialSidebarContext = (new DirectOpenContextService())->resolve($resolved);
				if ($initialSidebarContext !== null)
				{
					$welcomeDocumentId = $resolved;
				}
			}
		}

		$this->arResult = [
			'DOCUMENT_ID' => $documentId,
			'DIRECT_LINK' => $directLink,
			'INITIAL_COLLECTIONS' => $initialCollections,
			'INITIAL_SIDEBAR_CONTEXT' => $initialSidebarContext,
			'INITIAL_WELCOME_DOC_ID' => $welcomeDocumentId,
			'SIDEBAR_OPTIONS' => $sidebarOptions,
			'IS_MOBILE' => $this->isMobileHit(),
			'THEME' => $this->resolveTheme(),
		];

		$this->includeComponentTemplate();
	}

	protected function createLicenseService(): LicenseService
	{
		return new LicenseService();
	}

	protected function isNoteToolEnabled(): bool
	{
		if (!Loader::includeModule('intranet'))
		{
			return true;
		}

		return ToolsManager::getInstance()->checkAvailabilityByMenuId('menu_note_base');
	}

	// Seam for unit tests: CBitrixComponent::includeComponentTemplate() is final.
	protected function renderTariffStub(): void
	{
		$this->includeComponentTemplate();
	}

	private function resolveTheme(): string
	{
		$raw = \CUserOptions::GetOption('note', 'theme', self::THEME_DEFAULT);
		$value = is_string($raw) ? strtolower($raw) : self::THEME_DEFAULT;

		return $value === self::THEME_DARK ? self::THEME_DARK : self::THEME_LIGHT;
	}

	private function resolveSidebarOptions(): array
	{
		$options = \CUserOptions::GetOption('note', 'sidebar', []);
		$rawWidth = is_array($options) ? ($options['width'] ?? null) : null;
		$rawCollapsed = is_array($options) ? ($options['collapsed'] ?? null) : null;
		$width = is_numeric($rawWidth) ? (int)$rawWidth : self::SIDEBAR_DEFAULT_WIDTH;
		$width = max(self::SIDEBAR_MIN_WIDTH, min(self::SIDEBAR_MAX_WIDTH, $width));
		// On mobile hits the sidebar is force-expanded so the user lands on the collections list,
		// regardless of the saved CUserOptions preference. On desktop the saved preference wins.
		$collapsed = $rawCollapsed === 'Y' && !$this->isMobileHit();

		return [
			'width' => $width,
			'collapsed' => $collapsed,
		];
	}

	private function isMobileHit(): bool
	{
		$requestUri = (string)($_SERVER['REQUEST_URI'] ?? '');

		return str_starts_with($requestUri, '/mobile/');
	}
}
