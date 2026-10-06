<?php

use Bitrix\Main\Loader;
use Bitrix\Main\Localization\Loc;
use Bitrix\Note\Internal\Access\AccessController;
use Bitrix\Note\Internal\Access\ActionDictionary;
use Bitrix\Main\Engine\CurrentUser;
use Bitrix\Note\Internal\Integration\AiAssistant\AiChatAvailability;
use Bitrix\Note\Internal\Service\License\LicenseService;
use Bitrix\Note\Internal\Service\Sidebar\DirectOpenContextService;
use Bitrix\Note\Internal\Service\Sidebar\InitialCollectionsService;
use Bitrix\Note\Internal\Service\Sidebar\InitialFavoritesService;
use Bitrix\Note\Internal\Service\Sidebar\WelcomeRedirectService;
use Bitrix\Note\Internal\Configuration;

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

		// Tariff/tool blocking no longer short-circuits the entry: we always mount the
		// interface (once ACL passes) and open the tariff slider on top of it.
		$blockSliderCode = $this->createLicenseService()->resolveBlockingSliderCode();

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

		// A tariff/tool block mounts the interface only as a read-only teaser behind the
		// slider, which redirects to '/' the moment it closes. Suppress every side-effect
		// write in that case: no pull-watch registration, no welcome resolving, and no
		// has_visited persistence (the user has not actually seen the welcome document).
		$isBlocked = $blockSliderCode !== null;

		$documentId = (int)$this->arParams['DOCUMENT_ID'];
		$directLink = (string)$this->arParams['DIRECT_LINK'];
		$initialSidebarContext = null;
		$initialCollections = (new InitialCollectionsService())->resolve(registerPullWatches: !$isBlocked);
		// The favorites block is painted with the rest of the sidebar, so its first page travels with
		// the page instead of costing a request of its own - same reasoning as the collections above.
		// Not under a block though: the page source would carry the titles of documents the user reaches
		// by a personal grant, while the AJAX controllers that would answer for them are gated shut.
		$initialFavorites = $isBlocked ? null : (new InitialFavoritesService())->resolve();
		$sidebarOptions = $this->resolveSidebarOptions();
		$welcomeDocumentId = 0;

		// Under a tariff/tool block the document body must not be server-rendered even
		// for a direct link the user could open by ACL: the interface stays a shell teaser
		// behind the paywall slider. Loading it here would leak the protected content into
		// the page source, bypassing the AJAX/REST tariff gate.
		if ($directLink === 'Y' && $documentId > 0 && !$isBlocked)
		{
			$initialSidebarContext = $this->createDirectOpenContextService()->resolve($documentId);
		}
		elseif ($documentId === 0 && $directLink !== 'Y' && !$isBlocked)
		{
			$userId = (int)CurrentUser::get()->getId();
			$resolved = (new WelcomeRedirectService())->resolveFor($userId);
			\CUserOptions::SetOption('note', 'has_visited', 'Y');

			if ($resolved !== null)
			{
				$initialSidebarContext = $this->createDirectOpenContextService()->resolve($resolved);
				if ($initialSidebarContext !== null)
				{
					$welcomeDocumentId = $resolved;
				}
			}
		}

		// Asked once, after ACL. Independent of the tariff slider (which does not cancel mounting),
		// but suppressed under a block: behind the paywall teaser the chat has nothing to do.
		$aiChat = $this->createAiChatAvailability();
		$aiChatEnabled = !$isBlocked && $aiChat->isAvailable();

		$this->arResult = [
			'DOCUMENT_ID' => $documentId,
			'DIRECT_LINK' => $directLink,
			'INITIAL_COLLECTIONS' => $initialCollections,
			'INITIAL_FAVORITES' => $initialFavorites,
			'INITIAL_SIDEBAR_CONTEXT' => $initialSidebarContext,
			'INITIAL_WELCOME_DOC_ID' => $welcomeDocumentId,
			'SIDEBAR_OPTIONS' => $sidebarOptions,
			'IS_MOBILE' => $this->isMobileHit(),
			'THEME' => $this->resolveTheme(),
			// Non-null when the tariff/tool blocks access: the template opens the
			// corresponding slider on top of the mounted interface.
			'TARIFF_SLIDER_CODE' => $blockSliderCode,
			'HISTORY_ENABLED' => Configuration::isHistoryUiEnabled(),
			'NOTIFICATIONS_ENABLED' => Configuration::isNotificationsEnabled(),
			'HOTKEYS_ENABLED' => Configuration::isHotkeysUiEnabled(),
			// Replaces the flat note.shared page/button with the collapsible sidebar tree section.
			'SHARED_TREE_ENABLED' => Configuration::isSubtreeInheritanceEnabled(),
			// Feature flag: download/upload .md menu items are hidden unless explicitly enabled.
			'MARKDOWN_IO_ENABLED' => Configuration::isMarkdownIoEnabled(),
			// DTO-01. Both keys stay empty unless the chat is actually reachable, so the front end
			// cannot tell "flag off" from "conditions did not hold" — and must not try to.
			'AI_CHAT_ENABLED' => $aiChatEnabled,
			'AI_CHAT_NAME' => $aiChatEnabled ? $aiChat->getName() : '',
		];

		$this->renderTemplate();
	}

	protected function createLicenseService(): LicenseService
	{
		return new LicenseService();
	}

	protected function createAiChatAvailability(): AiChatAvailability
	{
		return new AiChatAvailability();
	}

	// Seam for unit tests: lets a test observe whether the direct-open document body
	// is loaded (it must not be under a tariff block).
	protected function createDirectOpenContextService(): DirectOpenContextService
	{
		return new DirectOpenContextService();
	}

	// Seam for unit tests: CBitrixComponent::includeComponentTemplate() is final.
	protected function renderTemplate(): void
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
			// Which blocks of the panel stand open. Read here rather than left to the client so the panel
			// is drawn the way it was left: taken from the page, the blocks are at their state in the first
			// frame instead of closing themselves once a preference arrives.
			'favoritesOpen' => $this->resolveSidebarSection($options, 'favoritesOpen'),
			'collectionsOpen' => $this->resolveSidebarSection($options, 'collectionsOpen'),
		];
	}

	/**
	 * A block of the panel is open unless it was explicitly closed: everyone who never touched a section
	 * header keeps the panel they have had all along.
	 */
	private function resolveSidebarSection(mixed $options, string $key): bool
	{
		$raw = is_array($options) ? ($options[$key] ?? null) : null;

		return $raw !== 'N';
	}

	private function isMobileHit(): bool
	{
		$requestUri = (string)($_SERVER['REQUEST_URI'] ?? '');

		return str_starts_with($requestUri, '/mobile/');
	}
}
