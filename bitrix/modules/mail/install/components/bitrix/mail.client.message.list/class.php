<?php

use Bitrix\Mail;
use Bitrix\Mail\Helper\Enum\Mailbox\FolderSortMode;
use Bitrix\Mail\Helper\Mailbox;
use Bitrix\Mail\Helper\Mailbox\Options\EntityDataHelper;
use Bitrix\Mail\Helper\MailboxAccess;
use Bitrix\Mail\Helper\Mailbox\MailboxGridCounterAggregator;
use Bitrix\Mail\Helper\MailboxDirectoryHelper;
use Bitrix\Mail\Internal\Service\MailboxCountersService;
use Bitrix\Mail\Internal\Service\Draft\DraftService;
use Bitrix\Mail\Helper\Message;
use Bitrix\Mail\Helper\MessageFolder;
use Bitrix\Mail\Helper\AnalyticsHelper;
use Bitrix\Mail\Helper\Label\LabelsFeature;
use Bitrix\Mail\Helper\Message\Loader\MessageFilter;
use Bitrix\Mail\Helper\Message\Loader\MessageLoader;
use Bitrix\Mail\Internal\Service\Label\LabelService;
use Bitrix\Mail\MessageView\AvatarManager;
use Bitrix\Mail\Internals\MessageAccessTable;
use Bitrix\Main;
use Bitrix\Main\Loader;
use Bitrix\Main\Mail\Address;
use Bitrix\Main\Context;
use Bitrix\Main\Text\Encoding;
use Bitrix\Main\ModuleManager;
use Bitrix\Main\Grid\Options;
use Bitrix\Main\Grid\MessageType;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\UI\PageNavigation;
use Bitrix\Mail\Helper\LicenseManager;
use Bitrix\Main\Engine\Contract\Controllerable;
use Bitrix\Main\Web\Json;
use Bitrix\Main\Web\Uri;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die;
}

Loader::includeModule('mail');

class CMailClientMessageListComponent extends CBitrixComponent implements Controllerable, Main\Errorable
{
	private const LIST_SECTION_PARAM = 'list_section';
	private const FAVORITES_SECTION = 'favorites';

	/**
	 * The side panel opens any same-origin link of the page in a slider of its own, and the address of
	 * an attachment falls under the rule of the mail client as well; a file belongs to the viewer and
	 * to the download, so the panel is told to keep out of the links of a chip.
	 */
	private const SLIDER_IGNORE_ATTRIBUTE = 'data-slider-ignore-autobinding="true"';

	public function configureActions()
	{
		$this->errorCollection = new Main\ErrorCollection();

		return [];
	}

	protected $componentId;
	protected $mailbox;
	/** @var Mailbox */
	protected $mailboxHelper;
	/** @var Main\ErrorCollection */
	private $errorCollection;
	private ?bool $listImprovementsEnabled = null;

	private bool $isAllMailMode = false;
	private bool $isDraftMode = false;

	public function syncMailCountersAction($mailboxId): void
	{
		$mailboxHelper = Mailbox::createInstance($mailboxId);
		$mailboxHelper->syncCounters();
		$mailboxHelper->sendCountersEvent();
	}

	public function getMailCountersAction(?int $mailboxId = null): array
	{
		return (new MailboxCountersService())->getCountersForUser((int)Main\Engine\CurrentUser::get()->getId(), $mailboxId);
	}

	public function getMailboxCachedConnectionStatusAction(int $mailboxId): ?bool
	{
		$userId = Main\Engine\CurrentUser::get()->getId();

		if (is_null($userId))
		{
			return null;
		}

		return (new Mail\Helper\Mailbox\MailboxSyncManager($userId))->getCachedConnectionStatus($mailboxId);
	}

	/**
	 * @deprecated Use \CMailClientMessageListComponent::getMailboxCachedConnectionStatusAction
	 */
	public function getLastMailboxSyncIsSuccessStatusAction(int $mailboxId): ?bool
	{
		$userId = Main\Engine\CurrentUser::get()->getId();

		if (is_null($userId))
		{
			return null;
		}

		return (new Mail\Helper\Mailbox\MailboxSyncManager($userId))->getLastMailboxSyncIsSuccessStatus($mailboxId);
	}

	public function getAttachmentsArchiveUrlAction(int $messageId): ?array
	{
		if (!$this->isListImprovementsEnabled())
		{
			$this->errorCollection->add([new Main\Error('Feature is not available.', 'MAIL_LIST_IMPROVEMENTS_DISABLED')]);

			return null;
		}

		$userId = (int)Main\Engine\CurrentUser::get()->getId();

		$result = (new Mail\Internal\Service\Attachment\ArchiveService())->getMessageArchiveUrl($messageId, $userId);

		if (!$result->isSuccess())
		{
			$this->errorCollection->add($result->getErrors());

			return null;
		}

		return $result->getData();
	}

	public function getAttachmentsAction(int $messageId): ?array
	{
		if (!$this->isListImprovementsEnabled())
		{
			$this->errorCollection->add([new Main\Error('Feature is not available.', 'MAIL_LIST_IMPROVEMENTS_DISABLED')]);

			return null;
		}

		$userId = (int)Main\Engine\CurrentUser::get()->getId();

		$result = (new Mail\Internal\Service\Attachment\ListingService())->getMessageAttachments($messageId, $userId);

		if (!$result->isSuccess())
		{
			$this->errorCollection->add($result->getErrors());

			return null;
		}

		return $result->getData();
	}

	private function getDateLastOpening($mailboxID)
	{
		$dateLastOpening = Mail\Internals\MailEntityOptionsTable::getList(
			[
				'select' => [
					'DATE_INSERT',
				],
				'filter' => [
					'=MAILBOX_ID' => $mailboxID,
					'=ENTITY_TYPE' => 'MAILBOX',
					'=ENTITY_ID' => $mailboxID,
					'=PROPERTY_NAME' => 'LAST_MAIL_OPENING',
				],
			],
		)->fetch();

		return $dateLastOpening['DATE_INSERT'] ?? new Main\Type\DateTime();
	}

	private function saveDateOpening($mailboxID): void
	{
		$filter = [
			'=MAILBOX_ID' => $mailboxID,
			'=ENTITY_TYPE' => 'MAILBOX',
			'=ENTITY_ID' => $mailboxID,
			'=PROPERTY_NAME' => 'LAST_MAIL_OPENING',
		];

		$keyRow = [
			'MAILBOX_ID' => $mailboxID,
			'ENTITY_TYPE' => 'MAILBOX',
			'ENTITY_ID' => $mailboxID,
			'PROPERTY_NAME' => 'LAST_MAIL_OPENING',
		];

		$fields = $keyRow;

		$fields['DATE_INSERT'] = new Main\Type\DateTime();

		if (Mail\Internals\MailEntityOptionsTable::getCount($filter))
		{
			Mail\Internals\MailEntityOptionsTable::update(
				$keyRow,
				[
					'DATE_INSERT' => new Main\Type\DateTime(),
				],
			);
		}
		else
		{
			Mail\Internals\MailEntityOptionsTable::add(
				$fields,
			);
		}
	}

	public static function getComponentId()
	{
		static $componentId;
		if (is_null($componentId))
		{
			$componentId = 'mail-client-list-manager';
		}

		return $componentId;
	}

	/**
	 * @throws Main\ArgumentNullException
	 * @throws Main\LoaderException
	 * @throws Main\ArgumentException
	 * @throws Main\ObjectPropertyException
	 * @throws Main\SystemException
	 */
	public function executeComponent(): void
	{
		global $USER, $APPLICATION;

		$APPLICATION->setTitle(Loc::getMessage('MAIL_CLIENT_HOME_TITLE_MSGVER_1'));

		if (!is_object($USER) || !$USER->isAuthorized())
		{
			$APPLICATION->authForm('');

			return;
		}

		$vars = $this->arParams['VARIABLES'];
		$listMode = $vars['list_mode'] ?? $this->request->getQuery('list_mode');
		$this->isDraftMode = $listMode === 'drafts';
		$this->arResult['IS_DRAFT_MODE'] = $this->isDraftMode;

		$this->arResult['VIRTUAL_FOLDER_KEY'] = MessageFolder::VIRTUAL_ALL_MESSAGES;
		$virtualParam = $vars['virtual'] ?? $this->request->getQuery('virtual');
		$this->isAllMailMode = ($virtualParam === MessageFolder::VIRTUAL_ALL_MESSAGES);
		$this->arResult['IS_ALL_MAIL_MODE'] = $this->isAllMailMode;

		$this->arResult['MAILBOXES'] = Mail\MailboxTable::getUserMailboxes();
		$this->arResult['MAILBOX'] = [];
		$this->arResult['USER_OWNED_MAILBOXES_COUNT'] = 0;

		foreach ($this->arResult['MAILBOXES'] as $k => $item)
		{
			if (empty($item['NAME']))
			{
				$item['NAME'] = ($item['EMAIL'] ?: $item['LOGIN']) ?: "#" . $item['ID'];
			}

			$this->arResult['MAILBOXES'][$k] = $item;

			if ((empty($vars['id']) && empty($this->arResult['MAILBOX'])) || $vars['id'] === $item['ID'])
			{
				$this->mailbox = $this->arResult['MAILBOX'] = $item;
			}

			if ($item['USER_ID'] === $USER->getId())
			{
				$this->arResult['USER_OWNED_MAILBOXES_COUNT']++;
			}
		}

		if (empty($this->mailbox))
		{
			if (isset($_REQUEST['strict']) && $_REQUEST['strict'] === 'N')
			{
				localRedirect($this->arParams['PATH_TO_MAIL_HOME'], true);
			}
			else
			{
				showError(Loc::getMessage('MAIL_CLIENT_ELEMENT_NOT_FOUND'));

				return;
			}
		}

		try
		{
			$this->mailboxHelper = Mailbox::createInstance($this->mailbox['ID']);
		}
		catch (Main\ObjectException)
		{
			if (isset($_REQUEST['strict']) && $_REQUEST['strict'] === 'N')
			{
				localRedirect($this->arParams['PATH_TO_MAIL_HOME'], true);
			}
			else
			{
				showError(Loc::getMessage('MAIL_CLIENT_ELEMENT_NOT_FOUND'));

				return;
			}
		}

		if (!$this->isDraftMode)
		{
			$this->mailboxHelper->cacheDirs();
		}

		$this->rememberCurrentMailboxId($this->mailbox['ID']);
		$this->rememberLastViewState();

		$this->arResult['CONFIG_SYNC_DIRS'] = $this->mailboxHelper->getDirsHelper()->getSyncDirs();

		if (empty($this->arResult['CONFIG_SYNC_DIRS']))
		{
			Mail\Helper::setMailboxUnseenCounter($this->mailbox['ID'],0);
		}

		$this->arResult['userHasCrmActivityPermission'] = MailboxAccess::hasCurrentUserAccessToViewMailboxIntegrationCrm();

		$userId = (int)Main\Engine\CurrentUser::get()->getId();

		$mailboxesUnseen = Message::getCountersForUserMailboxes($userId);

		foreach ($mailboxesUnseen as $mailboxId => $mailboxData)
		{
			$this->arResult['MAILBOXES'][$mailboxId]['__unseen'] = $mailboxData['UNSEEN'];
		}

		$globalUnseenCounter = (int)\CUserCounter::GetValue($userId, 'mail_unseen');
		$this->arResult['MESSAGE_COUNTER_IN_ALL_MAILBOXES'] = $globalUnseenCounter;

		$this->arResult['GRID_ID'] = $this->isDraftMode ? 'mail-internal-draft-list' : 'mail-message-list';
		$this->arResult['MESSAGE_HREF_LIST'] = [];
		$this->arResult['MESSAGES'] = [];
		$this->arResult['FILTER_ID'] = $this->isDraftMode
			? 'mail-internal-draft-filter'
			: ($this->isAllMailMode
				? 'mail-message-list-virtual'
				: 'mail-message-list-' . $this->mailbox['ID'])
		;

		$this->arResult['LABELS_ENABLED'] = LabelsFeature::isEnabled();
		$this->arResult['LABELS'] = $this->arResult['LABELS_ENABLED']
			? $this->getUserLabels($userId, $this->isAllMailMode ? null : (int)$this->mailbox['ID'])
			: [];

		if ($this->isDraftMode)
		{
			$this->setDraftFilterSettings();
		}
		else
		{
			$this->setFilterSettings($this->getDirsForFilter());
			$this->setFilterPresets();
		}

		$gridOptions = new Options($this->arResult['GRID_ID'], $this->arResult['FILTER_PRESETS']);

		$navData = $gridOptions->getNavParams(['nPageSize' => 25]);
		$pageNavigation = new PageNavigation(
			$this->isDraftMode ? 'mail-internal-draft-list' : 'mail-message-list',
		);
		$pageSize = $this->isDraftMode
			? min(50, max(1, (int)$navData['nPageSize']))
			: (int)$navData['nPageSize']
		;
		$pageNavigation->setPageSize($pageSize)->initFromUri();

		$request = Context::getCurrent()->getRequest();
		if (preg_match('/^\s*(\d+)\s*$/', (string)$request->getQuery($pageNavigation->getId()), $matches))
		{
			$pageNavigation->setCurrentPage($matches[1]);
		}

		$filterOption = new Main\UI\Filter\Options($this->arResult['FILTER_ID'], $this->arResult['FILTER_PRESETS']);

		if (!$this->request->isAjaxRequest())
		{
			$filterOption->reset();
			$this->clearFolderForFavoritesSection($filterOption);
			$filterOption->save();
		}

		$filterData = $this->applyFavoritesSection($filterOption->getFilter($this->arResult['FILTER']));

		$this->arResult['currentDir'] = '';

		if (isset($filterData['DIR']) && is_scalar($filterData['DIR']))
		{
			$this->arResult['currentDir'] = $filterData['DIR'];
		}

		// Options::getFilter() returns stored fields as is, so a value saved while its feature was
		// on would still reach MessageFilter.
		if (empty($this->arResult['LABELS_ENABLED']))
		{
			unset($filterData['LABEL_ID']);
		}

		$this->arResult['currentLabelId'] = isset($filterData['LABEL_ID']) && is_numeric($filterData['LABEL_ID'])
			? (int)$filterData['LABEL_ID']
			: 0;

		$this->arResult['gridActionsData'] = $this->getGridActionsData();

		$mailboxSyncAvailable = LicenseManager::checkTheMailboxForSyncAvailability((int)$this->mailbox['ID'], (int)$this->mailbox['USER_ID']);
		$canFetchMessages = $this->isDraftMode || $this->canFetchMessages($mailboxSyncAvailable);
		$this->arResult['MAILBOX_IS_SYNC_AVAILABILITY'] = $canFetchMessages;

		$this->arResult['ANALYTICS'] = $this->arParams['ANALYTICS'];
		$this->arResult['ANALYTICS']['SOURCE_DIR'] = $filterData['DIR'] ?? '';

		$mailboxIdsForFilter = $this->getMailboxIdsForFilter();

		if ($this->isAllMailMode)
		{
			$this->applyAllMailFilter($filterData, $mailboxIdsForFilter);
		}

		if ($this->isDraftMode)
		{
			$search = is_string($filterData['FIND'] ?? null)
				? trim($filterData['FIND'])
				: ''
			;
			$recipient = is_string($filterData['RECIPIENT'] ?? null)
				? mb_strtolower(trim($filterData['RECIPIENT']))
				: ''
			;
			$hasAttachments = $this->resolveDraftAttachmentFilter($filterData);

			$draftResult = (new DraftService())->list(
				userId: $userId,
				page: $pageNavigation->getCurrentPage(),
				pageSize: $pageNavigation->getPageSize(),
				search: $search,
				recipient: $recipient,
				hasAttachments: $hasAttachments,
			);
			$draftPage = $draftResult->getData()['page'] ?? ['items' => [], 'total' => 0];
			$this->arResult['ROWS'] = $this->getDraftRows($draftPage['items'] ?? []);
			$this->arResult['DRAFT_TOTAL'] = (int)($draftPage['total'] ?? 0);
			$this->arResult['IS_SEARCH'] = $search !== '' || $recipient !== '' || $hasAttachments !== null;
			$this->arResult['ENABLE_NEXT_PAGE'] =
				$pageNavigation->getCurrentPage() * $pageNavigation->getPageSize()
				< $this->arResult['DRAFT_TOTAL']
			;
		}
		elseif ($canFetchMessages)
		{
			$filter = new MessageFilter(
				$mailboxIdsForFilter,
				$filterData,
				true,
				$this->isListImprovementsEnabled() ? $userId : null,
				withAttachmentsStack: $this->isListImprovementsEnabled(),
			);
			$items = MessageLoader::getMessageList($filter, $pageNavigation);
			$this->arResult['ROWS'] = $this->getRows($items, $pageNavigation);
		}
		else
		{
			$this->arResult['ROWS'] = [];
		}

		$this->arResult['NAV_OBJECT'] = $pageNavigation;
		if (
			!$this->isDraftMode
			&& Mail\Helper\Config\Feature::isInternalDraftsWebAvailable()
		)
		{
			$this->arResult['EMBEDDED_DRAFT_LIST'] = $this->prepareEmbeddedDraftList($userId);
		}

		if ($this->isAllMailMode)
		{
			$this->arResult['DIRECTORY_HIERARCHY_WITH_UNSEEN_MAIL_COUNTERS'] = [];
			$this->arResult['DIRS_WITH_UNSEEN_MAIL_COUNTERS'] = [];
		}
		else
		{
			$this->arResult['DIRECTORY_HIERARCHY_WITH_UNSEEN_MAIL_COUNTERS'] = $this->getDirectoryHierarchyForContextMenuAction($this->mailbox['ID']);
			$this->arResult['DIRS_WITH_UNSEEN_MAIL_COUNTERS'] = $this->mailboxHelper->getDirsWithUnseenMailCounters();
		}

		if ($this->request->getPost('errorMessage'))
		{
			$this->arResult["MESSAGES"][] = [
				"TYPE" => MessageType::ERROR,
				"TITLE" => Loc::getMessage('MAIL_CLIENT_AJAX_ERROR'),
				"TEXT" => Encoding::convertEncodingToCurrent($this->request->getPost('errorMessage')),
			];
		}

		$currentUserId = (string)\Bitrix\Main\Engine\CurrentUser::get()->getId();

		$folderOptions = EntityDataHelper::getValues(
			(int)$this->mailbox['ID'],
			\Bitrix\Mail\Helper\Enum\Mailbox\EntityOptionsType::User,
			$currentUserId,
			[
				EntityDataHelper::FOLDER_SORT_MODE,
				EntityDataHelper::FOLDER_EXPAND_STATE,
				EntityDataHelper::FOLDER_CUSTOM_ORDER,
			],
		);

		$isFolderManualSortingAvailable = Mail\Helper\Config\Feature::isFolderManualSortingAvailable();
		$this->arResult['FOLDER_MANUAL_SORTING_AVAILABLE'] = $isFolderManualSortingAvailable;

		$folderSortMode = $folderOptions[EntityDataHelper::FOLDER_SORT_MODE] ?? 'default';
		$this->arResult['folderSortMode']
			= !$isFolderManualSortingAvailable && $folderSortMode === FolderSortMode::Manual->value
				? FolderSortMode::Default->value
				: $folderSortMode;
		$this->arResult['folderExpandState'] = $folderOptions[EntityDataHelper::FOLDER_EXPAND_STATE] ?? '{}';
		$this->arResult['folderCustomOrder'] = $isFolderManualSortingAvailable
			? ($folderOptions[EntityDataHelper::FOLDER_CUSTOM_ORDER] ?? '{}')
			: '{}';
		$this->arResult['folderDefaultOrder'] = array_values(array_map(
			static fn ($dir): int => (int)$dir->getId(),
			array_filter(
				$this->mailboxHelper->getDirsHelper()->getSyncDirsOrdered(),
				static fn ($dir): bool => !$dir->isVirtualFolder(),
			),
		));

		$this->arResult['IS_MAIL_LIST_IMPROVEMENTS_AVAILABLE'] = $this->isListImprovementsEnabled();
		$this->arResult['IS_FAVORITES_SECTION_ACTIVE'] = $this->isFavoritesSectionActive();

		$this->arResult['defaultDir'] = $this->mailboxHelper->getDirsHelper()->getDefaultDirPath(true);
		$this->arResult['spamDir'] = $this->mailboxHelper->getDirsHelper()->getSpamPath(true);
		$this->arResult['trashDir'] = $this->mailboxHelper->getDirsHelper()->getTrashPath(true);
		$this->arResult['outcomeDir'] = $this->mailboxHelper->getDirsHelper()->getOutcomePath(true);
		$this->arResult['draftsDir'] = $this->mailboxHelper->getDirsHelper()->getDraftsPath(true);

		if ($this->isDraftMode)
		{
			$this->arResult['MAILBOX_CAN_DELETE'] = [];
			$this->arResult['MAILBOX_CAN_MARK_SPAM'] = [];
			$this->arResult['foldersItems'] = [];
		}
		else
		{
			$this->arResult['MAILBOX_CAN_DELETE'] = [];
			$this->arResult['MAILBOX_CAN_MARK_SPAM'] = [];
			foreach ($this->arResult['MAILBOXES'] as $mailboxItem)
			{
				$mailboxIdInt = (int)$mailboxItem['ID'];
				$helper = Mailbox::createInstance($mailboxIdInt, false);
				if (!$helper)
				{
					continue;
				}
				$dirs = $helper->getDirsHelper();
				$this->arResult['MAILBOX_CAN_DELETE'][$mailboxIdInt] = (bool)$dirs->getTrashPath(true);
				$this->arResult['MAILBOX_CAN_MARK_SPAM'][$mailboxIdInt] = (bool)$dirs->getSpamPath(true);
			}

			$this->arResult['foldersItems'] = $this->isAllMailMode
				? []
				: $this->getDirectoryHierarchyForContextMenuAction($this->mailbox['ID'])
			;
		}


		$email = $this->mailbox['NAME'];
		$pieces = explode("@", (string)$email);
		$name = $pieces[0];
		$domain = '';

		if (count($pieces) > 1)
		{
			$domain = '@' . $pieces[1];
		}

		$this->arResult['MAILBOX_NAME'] = $name;
		$this->arResult['MAILBOX_DOMAIN'] = $domain;

		$this->arResult['invisibleDirsToCounters'] = [
			'',
			$this->arResult['spamDir'],
			$this->arResult['trashDir'],
			$this->arResult['outcomeDir'],
			$this->arResult['draftsDir'],
		];

		$this->arResult['MAX_ALLOWED_CONNECTED_MAILBOXES'] = LicenseManager::getUserMailboxesLimit();

		if (!$this->isDraftMode)
		{
			$this->saveDateOpening($this->mailbox['ID']);
		}

		$this->arResult['HAS_ACCESS_TO_MAILBOX_GRID'] = $this->hasAccessToMailboxGrid();
		$this->arResult['MAILBOX_GRID_TARIFF_RESTRICTED'] = !LicenseManager::isMailboxManagementEnabled();

		$this->arResult['HAS_ACCESS_TO_ACCESS_RIGHTS'] = $this->hasAccessToAccessRights();
		$this->arResult['ACCESS_RIGHTS_TARIFF_RESTRICTED'] = !LicenseManager::isAccessRightsEnabled();

		$this->arResult['NEED_SHOW_MAILBOX_GRID_HINT'] = $this->needShowMailboxGridHint();
		$this->arParams['MAILBOX_GRID_GUIDE_NAME'] = Mail\Helper\Config\Guide::getMailboxGridGuideOptionName();
		$this->arResult['NEED_SHOW_FOLDER_SORT_GUIDE'] = $isFolderManualSortingAvailable
			&& !Mail\Helper\Config\Guide::wasFolderSortGuideShown();

		$this->arResult['NEED_SHOW_DISCUSS_IN_CHAT_GUIDE'] = $this->needShowDiscussInChatGuide();
		$this->arParams['DISCUSS_IN_CHAT_GUIDE_NAME'] = Mail\Helper\Config\Guide::getDiscussInChatGuideOptionName();

		$this->arResult['NEED_SHOW_ALL_MAIL_MODE_GUIDE'] = !Mail\Helper\Config\Guide::wasAllMailModeGuideShown() && count($this->arResult['MAILBOXES']) >= 2;
		$this->arResult['ALL_MAIL_MODE_GUIDE_OPTION_NAME'] = Mail\Helper\Config\Guide::getAllMailModeGuideOptionName();

		$this->arResult['NEED_SHOW_LABELS_ONBOARDING'] = Mail\Helper\Config\Guide::shouldShowLabelsOnboarding($userId);
		$this->arResult['LABELS_ONBOARDING_OPTION_NAME'] = Mail\Helper\Config\Guide::getLabelsOnboardingOptionName();

		$this->arResult['PENDING_CONNECTION_REQUESTS_COUNT'] = $this->getPendingConnectionRequestsCount();
		$this->arResult['MAILBOX_GRID_BUTTON_COUNTER'] = $this->arResult['HAS_ACCESS_TO_MAILBOX_GRID']
			? $this->getMailboxGridButtonCounter((int)Main\Engine\CurrentUser::get()->getId())
			: 0;

		$this->includeComponentTemplate();
	}

	private function prepareEmbeddedDraftList(int $userId): array
	{
		$gridId = 'mail-internal-draft-list';
		$filterId = 'mail-internal-draft-filter';
		$filterSettings = $this->getDraftFilterSettings();
		$gridOptions = new Options($gridId);
		$navData = $gridOptions->getNavParams(['nPageSize' => 25]);
		$pageSize = min(50, max(1, (int)$navData['nPageSize']));
		$pageNavigation = new PageNavigation($gridId);
		$pageNavigation->setPageSize($pageSize);

		$filterOptions = new Main\UI\Filter\Options($filterId, $filterSettings['presets']);
		$filterData = $filterOptions->getFilter($filterSettings['fields']);
		$draftResult = (new DraftService())->list(
			userId: $userId,
			page: 1,
			pageSize: $pageSize,
			search: trim((string)($filterData['FIND'] ?? '')),
			recipient: mb_strtolower(trim((string)($filterData['RECIPIENT'] ?? ''))),
			hasAttachments: $this->resolveDraftAttachmentFilter($filterData),
		);
		$draftPage = $draftResult->getData()['page'] ?? ['items' => [], 'total' => 0];
		$total = (int)($draftPage['total'] ?? 0);

		return [
			'GRID_ID' => $gridId,
			'FILTER_ID' => $filterId,
			'FILTER' => $filterSettings['fields'],
			'FILTER_PRESETS' => $filterSettings['presets'],
			'ROWS' => $this->getDraftRows($draftPage['items'] ?? []),
			'TOTAL' => $total,
			'NAV_OBJECT' => $pageNavigation,
			'ENABLE_NEXT_PAGE' => $pageSize < $total,
		];
	}

	private function canFetchMessages(bool $currentMailboxAvailable): bool
	{
		if ($currentMailboxAvailable || !$this->isAllMailMode)
		{
			return $currentMailboxAvailable;
		}

		foreach ($this->arResult['MAILBOXES'] as $mailboxItem)
		{
			if (LicenseManager::checkTheMailboxForSyncAvailability((int)$mailboxItem['ID'], (int)$mailboxItem['USER_ID']))
			{
				return true;
			}
		}

		return false;
	}

	/**
	 * @param array|int|float|string|bool|null $items
	 * @param PageNavigation $navigation
	 *
	 * @return array
	 * @throws Main\ArgumentException
	 * @throws Main\LoaderException
	 * @throws Main\ObjectPropertyException
	 * @throws Main\SystemException
	 */
	private function getRows(array|int|float|string|bool|null $items, PageNavigation $navigation): array
	{
		$rows = [];
		$avatarConfigs = $this->getAvatarConfigs($items);

		$dateLastOpening = makeTimeStamp($this->getDateLastOpening($this->mailbox['ID']));

		$availableSourceDirs = AnalyticsHelper::getAvailableDirsForAnalytics();
		foreach ($items as $item)
		{
			$url = \CComponentEngine::makePathFromTemplate(
				$this->arParams['PATH_TO_MAIL_MSG_VIEW'],
				['id' => $item['MESSAGE_ID']],
			);
			$url = AnalyticsHelper::addSourceAnalyticsToMessage($url, AnalyticsHelper::ENTITY_TYPE_MAIL);

			$sliderData = ['printable' => true];
			if (
				in_array(
					mb_strtolower($this->arResult['ANALYTICS']['SOURCE_DIR'] ?? null),
					$availableSourceDirs,
					true,
				)
			)
			{
				$sliderData['data'] = [
					'analytics' => [
						'source_dir' => $this->arResult['ANALYTICS']['SOURCE_DIR'],
					],
				];
			}

			$onclickOpenMessageViewMethod = sprintf(
				'top.BX.SidePanel.Instance.open("%s", %s)',
				$url,
				Json::encode($sliderData),
			);

			$this->arResult['MESSAGE_HREF_LIST'][] = [
				'ID' => $item['MESSAGE_ID'],
				'HREF' => $url,
			];

			$onclickEventOpenMessageMethod = 'BX.onCustomEvent(
			`mail:openMessageForView`,
			[{
				id: `' . htmlspecialcharsbx($item['MESSAGE_ID']) . '`
			}]); ';

			if (count($rows) >= $navigation->getLimit())
			{
				$this->arResult['ENABLE_NEXT_PAGE'] = true;

				break;
			}

			$item['ID'] = $item['UID_ID'] . '-' . $item['MAILBOX_ID'];

			$fieldDateInTimeStamp = makeTimeStamp($item['INTERNALDATE'] ?? $item['FIELD_DATE']);
			$openMessageScript = $onclickEventOpenMessageMethod . $onclickOpenMessageViewMethod;
			$dir = $this->mailboxHelper->getDirsHelper()->getDirByHash($item['DIR_MD5']);

			$avatarKey = AvatarManager::getAvatarKeyByString($item['FIELD_FROM']);
			$isOutgoing = $this->isOutgoingMessage($item);
			$sourceField = ($isOutgoing && !empty($item['FIELD_TO'])) ? $item['FIELD_TO'] : $item['FIELD_FROM'];
			if ($isOutgoing && !empty($item['FIELD_TO']))
			{
				$avatarKey = AvatarManager::getAvatarKeyByString($item['FIELD_TO']);
			}

			$avatarParams = !empty($avatarKey) && !empty($avatarConfigs[$avatarKey])
				? $avatarConfigs[$avatarKey]
				: [];

			$columns = [];
			// the column of the star exists only where the star does; the unseen dot has its own
			// place in the sender cell and does not keep the column alive for itself
			if ($this->isListImprovementsEnabled())
			{
				$columns['FAVORITE'] = $this->buildFavoriteCell($item, $dir);
			}
			$columns['FROM'] = $this->buildFromCell(
				$item,
				$this->getSenderColumnCell($avatarParams) . $this->buildSenderLinks($sourceField, $openMessageScript),
				$dir !== null && $dir->isSpam(),
			);
			$columns['SUBJECT'] = $this->buildSubjectCell($item, $openMessageScript);
			$columns['DATE'] = $this->buildDateCell($item, (int)$fieldDateInTimeStamp);

			$taskUri = new Uri(
				\CComponentEngine::makePathFromTemplate(
					$this->arParams['PATH_TO_USER_TASKS_TASK'],
					[
						'action' => 'edit',
						'task_id' => '0',
					],
				),
			);

			$taskUri->addParams([
				'ta_sec' => 'mail',
				'ta_el' => 'context_menu',
				'TITLE' => Loc::getMessage(
						'MAIL_MESSAGE_TASK_TITLE',
						['#SUBJECT#' => $item['SUBJECT']],
					)
				,
				'UF_MAIL_MESSAGE' => (int)$item['MESSAGE_ID'],
				'MAIL_SUBJECT' => $item['SUBJECT'],
				'MAIL_FROM' => $item['FIELD_FROM'],
				'MAIL_DATE' => $fieldDateInTimeStamp,
			]);

			$taskHref = $taskUri->getUri();

			$postUri = new Uri(
				\CComponentEngine::makePathFromTemplate(
					$this->arParams['PATH_TO_USER_BLOG_POST_EDIT'],
					[
						'post_id' => '0',
					],
				),
			);

			$postUri->addParams([
				'TITLE' => Loc::getMessage(
						'MAIL_MESSAGE_POST_TITLE',
						['#SUBJECT#' => $item['SUBJECT']],
					)
				,
				'UF_MAIL_MESSAGE' => (int)$item['MESSAGE_ID'],
			]);

			$postHref = $postUri->getUri();

			$bindingParams = [
				'taskHref' => $taskHref,
				'postHref' => $postHref,
			];

			$bindingsColumns = $this->buildBindingsColumns($item, $bindingParams);
			foreach ($bindingsColumns as $key => $value)
			{
				$columns[$key] = $value;
			}

			$actionColumns = $this->buildActionColumns($item);
			foreach ($actionColumns as $key => $value)
			{
				$columns[$key] = $value;
			}

			$rows[$item['ID']] = [
				'id' => $item['ID'],
				'data' => $item,
				'columns' => $columns,
				'attrs' => [
					'unseen' => $this->isUnseen($item) ? 'true' : 'false',
					'new-message' => ($dateLastOpening <= $fieldDateInTimeStamp) ? 'true' : 'false',
					// The row data of the grid never reaches the client, so the mailbox a row belongs to
					// travels as an attribute: the all-mail list mixes mailboxes in one grid.
					'data-mailbox-id' => (int)$item['MAILBOX_ID'],
				],
			];

			$rows[$item['ID']]['actions'] = $this->buildRowActions($item, [
				'taskHref' => $taskHref,
				'postHref' => $postHref,
			]);
		}

		return $rows;
	}

	private function getDraftRows(array $items): array
	{
		$rows = [];
		$dataNow = localtime(time() + \CTimeZone::getOffset(), true);
		$today = mktime(0, 0, 0, $dataNow['tm_mon'] + 1, $dataNow['tm_mday'], $dataNow['tm_year'] + 1900);
		$titleDateFormat = Context::getCurrent()->getCulture()->getFullDateFormat() . "&#013;H:i:s";

		foreach ($items as $item)
		{
			$columns = [];
			$draftId = (int)($item['id'] ?? 0);
			if ($draftId <= 0)
			{
				continue;
			}

			$openAction = sprintf(
				"BX.Mail.Client.Message.List['%s'].openDraft(%d)",
				\CUtil::jsEscape(self::getComponentId()),
				$draftId,
			);
			$openClickAction = 'event.stopPropagation(); ' . $openAction . '; return false;';
			$deleteAction = sprintf(
				"BX.Mail.Client.Message.List['%s'].confirmDeleteDraft(%d)",
				\CUtil::jsEscape(self::getComponentId()),
				$draftId,
			);

			$recipients = [];
			foreach (($item['recipients'] ?? []) as $recipient)
			{
				$displayText = (string)(($recipient['name'] ?? '') ?: ($recipient['email'] ?? ''));
				if ($displayText !== '')
				{
					$recipients[] = htmlspecialcharsbx($displayText, ENT_QUOTES);
				}
			}

			$from = implode(Loc::getMessage('MAIL_MESSAGE_SEPARATOR_OF_NAMES_AND_EMAILS_IN_LISTS'), $recipients);
			if ($from === '')
			{
				$from = '<span class="mail-draft-no-recipients">'
					. (Loc::getMessage('MAIL_DRAFT_LIST_NO_RECIPIENTS') ?? Loc::getMessage('MAIL_MESSAGE_EMPTY_RCPT'))
					. '</span>'
				;
			}
			$columns['FROM'] = '<span class="mail-name-block mail-msg-list-cell-nowrap mail-msg-list-cell-flex">'
				. '<a class="mail-msg-from-title" onclick="' . htmlspecialcharsbx($openClickAction, ENT_QUOTES) . '">'
				. $from . '</a>'
				. '</span>'
			;

			$subject = trim((string)($item['subject'] ?? ''));
			if ($subject === '')
			{
				$subject = (string)Loc::getMessage('MAIL_MESSAGE_EMPTY_SUBJECT_PLACEHOLDER');
			}

			$bodyPreview = trim((string)($item['bodyPreview'] ?? ''));
			$subjectContent = '<a class="mail-msg-list-subject" onclick="'
				. htmlspecialcharsbx($openClickAction, ENT_QUOTES)
				. '" title="' . htmlspecialcharsbx($subject, ENT_QUOTES) . '">'
				. htmlspecialcharsbx($subject, ENT_QUOTES) . '</a>'
			;
			if ($bodyPreview !== '')
			{
				$subjectContent .= '<span class="mail-draft-body-preview"> &mdash; '
					. htmlspecialcharsbx($bodyPreview, ENT_QUOTES) . '</span>'
				;
			}
			if ((int)($item['attachmentCount'] ?? 0) > 0)
			{
				$subjectContent .= $this->buildAttachmentIcon();
			}
			$columns['SUBJECT'] = '<span class="mail-title-block mail-msg-list-cell-flex">'
				. $subjectContent . '</span>'
			;

			// updatedAt arrives as DATE_ATOM, shift it to user time like the message rows do
			$updatedAt = strtotime((string)($item['updatedAt'] ?? ''));
			$columns['DATE'] = '';
			if ($updatedAt !== false)
			{
				$updatedAt += \CTimeZone::getOffset();
				$dateDisplayFormat = $updatedAt >= $today
					? Context::getCurrent()->getCulture()->getShortTimeFormat()
					: Context::getCurrent()->getCulture()->getDayShortMonthFormat()
				;
				$columns['DATE'] = '<span title="'
					. FormatDate($titleDateFormat, $updatedAt, time() + \CTimeZone::getOffset()) . '">'
					. '<span class="mail-msg-date-title">'
					. FormatDate($dateDisplayFormat, $updatedAt, time() + \CTimeZone::getOffset())
					. '</span></span>'
				;
			}

			$rowId = 'draft-' . $draftId;
			$rows[$rowId] = [
				'id' => $rowId,
				'data' => ['ID' => $draftId],
				'columns' => $columns,
				'attrs' => [
					'data-testid' => 'mail-draft-list-item-' . $draftId,
					'data-draft-id' => $draftId,
				],
				'actions' => [
					[
						'id' => $this->arResult['gridActionsData']['view']['id'],
						'icon' => $this->arResult['gridActionsData']['view']['icon'],
						'text' => $this->arResult['gridActionsData']['view']['text'],
						'title' => $this->arResult['gridActionsData']['view']['title'],
						'onclick' => $openAction,
					],
					[
						'id' => $this->arResult['gridActionsData']['delete']['id'],
						'icon' => $this->arResult['gridActionsData']['delete']['icon'],
						'text' => $this->arResult['gridActionsData']['delete']['text'],
						'title' => $this->arResult['gridActionsData']['delete']['title'],
						'onclick' => $deleteAction,
					],
				],
			];
		}

		return $rows;
	}

	private function isListImprovementsEnabled(): bool
	{
		if ($this->listImprovementsEnabled === null)
		{
			$this->listImprovementsEnabled = Mail\Helper\Config\Feature::isMailListImprovementsAvailable();
		}

		return $this->listImprovementsEnabled;
	}

	private function isFavoritesSectionActive(): bool
	{
		return $this->isListImprovementsEnabled()
			&& !$this->isDraftMode
			&& $this->request->getQuery(self::LIST_SECTION_PARAM) === self::FAVORITES_SECTION
		;
	}

	private function getMailboxIdsForFilter(): array
	{
		return $this->isAllMailMode
			? array_keys($this->arResult['MAILBOXES'])
			: [$this->mailbox['ID']]
		;
	}

	/**
	 * The section spans the whole mailbox, so the screen opens with nothing narrowing the selection. The
	 * reset above drops the applied filter, after which the preset pinned by the user comes back as the
	 * current one - and the filter would keep claiming a scope the section does not have. The empty
	 * folder is the same value the left menu writes when a folder is picked, so both ways into the
	 * section leave the filter in one state.
	 */
	private function clearFolderForFavoritesSection(Main\UI\Filter\Options $filterOption): void
	{
		if (!$this->isFavoritesSectionActive())
		{
			return;
		}

		// the all mail mode has no folder field, but a pinned binding preset survives the reset there too
		$fields = $this->isAllMailMode ? [] : ['DIR' => ''];

		$filterOption->setFilterSettings(
			Main\UI\Filter\Options::TMP_FILTER,
			['fields' => $fields],
			true,
			false,
		);
	}

	/**
	 * The section is addressed by the request marker only, so a value saved in the filter settings
	 * is dropped instead of being read: otherwise a foreign preset would revive the section.
	 */
	private function applyFavoritesSection(array $filterData): array
	{
		unset($filterData['IS_FAVORITE']);

		if (!$this->isFavoritesSectionActive())
		{
			return $filterData;
		}

		// the section spans the whole mailbox, so the folder and the label give way to it
		unset($filterData['DIR'], $filterData['LABEL_ID']);

		$filterData['IS_FAVORITE'] = 'Y';
		$filterData['EXCLUDE_MD5_DIRS'] = MailboxDirectoryHelper::getSpamAndTrashDirsMd5ForMailboxes(
			$this->getMailboxIdsForFilter(),
		);
		// no preset carries the section, so MessageFilter has to be told the filter is applied
		$filterData['FILTER_APPLIED'] = 'Y';

		return $filterData;
	}

	private function isUnseen(array $item): bool
	{
		return !in_array((string)$item['IS_SEEN'], ['Y', 'S'], true);
	}

	private function buildCellClassList(array $item, array $classes): string
	{
		if ($this->isUnseen($item))
		{
			$classes[] = 'mail-msg-list-cell-unseen';
		}

		return implode(' ', $classes);
	}

	private function isOutgoingMessage(array $item): bool
	{
		foreach (Message::parseAddressList($item['FIELD_FROM']) as $candidate)
		{
			$address = new Address($candidate);
			if ($address->validate())
			{
				return $address->getEmail() === $this->mailbox['EMAIL'];
			}
		}

		return false;
	}

	/**
	 * The column of the star is the user's to hide, and the folders of spam and of the bin have no
	 * star at all, so the cell can well come out empty — but the unseen dot never rides here: it
	 * belongs to the sender cell, which no column set can take out of the row.
	 */
	private function buildFavoriteCell(array $item, ?Mail\Internals\Entity\MailboxDirectory $dir): string
	{
		$favorite = $this->isListImprovementsEnabled() && $this->isFavoriteAvailableInDir($dir)
			? $this->buildFavoriteButton($item)
			: ''
		;

		return '<span class="mail-msg-list-status">' . $favorite . '</span>';
	}

	private function buildUnseenIndicator(): string
	{
		return '<span class="mail-msg-list-unseen-slot">'
			. '<span class="mail-msg-list-unseen-dot" data-testid="mail-list-unseen-dot">'
			. '<span class="mail-msg-list-unseen-dot-label">'
			. htmlspecialcharsbx(Loc::getMessage('MAIL_MESSAGE_LIST_UNSEEN_DOT_LABEL'), ENT_QUOTES)
			. '</span></span></span>';
	}

	private function isFavoriteAvailableInDir(?Mail\Internals\Entity\MailboxDirectory $dir): bool
	{
		return $dir === null || (!$dir->isSpam() && !$dir->isTrash());
	}

	private function buildFavoriteButton(array $item): string
	{
		$isFavorite = !empty($item['__is_favorite']);

		return '<button type="button" class="mail-msg-list-favorite' . ($isFavorite ? ' --active' : '')
			. '" data-role="mail-list-favorite" data-testid="mail-list-favorite-btn"'
			. ' data-favorite-id="' . $item['ID'] . '"'
			. ' aria-pressed="' . ($isFavorite ? 'true' : 'false') . '"'
			. ' aria-label="' . htmlspecialcharsbx(Loc::getMessage('MAIL_MESSAGE_LIST_FAVORITE_LABEL'), ENT_QUOTES)
			. '"><span class="mail-msg-list-favorite__icon"></span></button>';
	}

	private function buildFromCell(array $item, string $content, bool $isSpamDir): string
	{
		$classes = [
			'mail-msg-list-sender-block',
			'mail-msg-list-cell-' . $item['MESSAGE_ID'],
			'mail-msg-list-cell-nowrap',
			'mail-msg-list-cell-flex',
		];

		if ($isSpamDir)
		{
			array_unshift($classes, 'js-spam');
		}

		// the dot opens the cell of the sender, right before the avatar
		return '<span data-message-id="' . $item['MESSAGE_ID'] . '" class="'
			. $this->buildCellClassList($item, $classes) . '">'
			. $this->buildUnseenIndicator() . $content . '</span>';
	}

	private function buildSenderLinks(string $addressList, string $openMessageScript): string
	{
		$values = [];

		foreach (Message::parseAddressList($addressList) as $rawAddress)
		{
			$address = new Address($rawAddress);

			if ($address->validate())
			{
				$name = $address->getName() ? Mail\Message::stripQuotes($address->getName()) : null;
				$email = $address->getEmail() ? Mail\Message::stripQuotes($address->getEmail()) : null;
				$title = ($name ? $name . ' / ' : '') . $email;
				$text = (string)($name ?: $email);
			}
			else
			{
				// an address the parser could not read opens the message all the same, as plain text of its own
				$title = $rawAddress;
				$text = $rawAddress;
			}

			$values[] = '<a onclick=\'' . $openMessageScript . '\' class="mail-msg-list-sender"'
				. ' data-testid="mail-list-sender-link" title="'
				. htmlspecialcharsbx($title, ENT_QUOTES) . '">'
				. htmlspecialcharsbx($text, ENT_QUOTES) . '</a>';
		}

		return implode((string)Loc::getMessage('MAIL_MESSAGE_SEPARATOR_OF_NAMES_AND_EMAILS_IN_LISTS'), $values);
	}

	private function buildSubjectCell(array $item, string $openMessageScript): string
	{
		$subject = htmlspecialcharsbx($this->getSubjectText($item), ENT_QUOTES);

		$classes = ['mail-msg-list-subject-block', 'mail-msg-list-cell-' . $item['ID']];
		if ($item['IS_OLD'] === 'Y')
		{
			$classes[] = 'mail-msg-list-cell-old';
		}

		$attachments = '';
		$icon = '';
		if ($this->isListImprovementsEnabled())
		{
			$attachments = $this->buildAttachmentsBlock($item);
			if ($attachments === '' && $this->hasAttachments($item))
			{
				// a summary that arrived without a single live file promises nothing more
				if ($this->isAttachmentsSummaryLoaded($item))
				{
					$icon = $this->buildAttachmentIcon();
				}
				else
				{
					$attachments = $this->buildLoadingAttachmentsBlock();
				}
			}
		}
		elseif ($this->hasAttachments($item))
		{
			$icon = $this->buildAttachmentIcon();
		}

		$subjectLink = '<a class="mail-msg-list-subject" data-testid="mail-list-subject-link"'
			. ' onclick=\'' . $openMessageScript . '\' title="'
			. $subject . '">' . $subject . '</a>'
		;

		// the paperclip shares the line with the subject, the row of files keeps its own line below
		$subjectLine = $icon === ''
			? $subjectLink
			: '<span class="mail-msg-list-subject-line mail-msg-list-cell-flex">' . $subjectLink . $icon . '</span>'
		;

		return '<div class="' . $this->buildCellClassList($item, $classes) . '">'
			. $subjectLine
			. $attachments
			. '</div>';
	}

	private function getSubjectText(array $item): string
	{
		if (trim((string)$item['SUBJECT']) !== '')
		{
			return (string)$item['SUBJECT'];
		}

		$generated = Message::extractSubjectFromBody((string)$item['BODY']);

		return $generated !== '' ? $generated : (string)Loc::getMessage('MAIL_MESSAGE_EMPTY_SUBJECT_PLACEHOLDER');
	}

	private function buildDateCell(array $item, int $timestamp): string
	{
		$culture = Context::getCurrent()->getCulture();
		$now = time() + \CTimeZone::getOffset();
		$localNow = localtime($now, true);
		$startOfDay = mktime(0, 0, 0, $localNow['tm_mon'] + 1, $localNow['tm_mday'], $localNow['tm_year'] + 1900);

		$displayFormat = $timestamp >= $startOfDay
			? $culture->getShortTimeFormat()
			: $culture->getDayShortMonthFormat()
		;

		$classes = $this->buildCellClassList($item, ['mail-msg-list-date-block', 'mail-msg-list-cell-' . $item['ID']]);

		return '<span class="' . $classes . '" title="'
			. FormatDate($culture->getFullDateFormat() . '&#013;H:i:s', $timestamp, $now) . '">'
			. '<span class="mail-msg-date-title">' . FormatDate($displayFormat, $timestamp, $now) . '</span>'
			. '</span>';
	}

	private function buildAttachmentsBlock(array $item): string
	{
		$stack = $item['__attachments_stack'] ?? null;
		if (!is_array($stack))
		{
			return '';
		}

		$count = (int)($stack['count'] ?? 0);
		$icons = is_array($stack['icons'] ?? null) ? $stack['icons'] : [];
		if ($count <= 0 || empty($icons))
		{
			return '';
		}

		$chips = '';
		foreach ($icons as $icon)
		{
			$chips .= $this->buildAttachmentChip(is_array($icon) ? $icon : []);
		}

		$restCount = $count - count($icons);
		if ($restCount > 0)
		{
			$chips .= $this->buildAttachmentsMoreChip((int)$item['MESSAGE_ID'], $count, $restCount);
		}

		return '<div class="mail-msg-list-attachments" data-testid="mail-list-attachments">' . $chips . '</div>';
	}

	private function isAttachmentsSummaryLoaded(array $item): bool
	{
		return is_array($item['__attachments_stack'] ?? null);
	}

	private function hasAttachments(array $item): bool
	{
		$options = is_array($item['OPTIONS'] ?? null) ? $item['OPTIONS'] : [];

		return (int)($options['attachments'] ?? 0) > 0 || (int)($item['ATTACHMENTS'] ?? 0) > 0;
	}

	private function buildAttachmentIcon(): string
	{
		$hint = htmlspecialcharsbx(Loc::getMessage('MAIL_MESSAGE_LIST_ATTACH_ICON_HINT'), ENT_QUOTES);

		return '<span class="mail-msg-list-attach-icon" role="img" data-testid="mail-list-attach-icon"'
			. ' title="' . $hint . '"></span>';
	}

	/**
	 * The summary of the files arrives after the message itself, so until then their row is held by
	 * a chip that only says so: it leads nowhere and opens nothing.
	 */
	private function buildLoadingAttachmentsBlock(): string
	{
		$text = htmlspecialcharsbx(Loc::getMessage('MAIL_MESSAGE_LIST_ATTACHMENT_LOADING'), ENT_QUOTES);

		return '<div class="mail-msg-list-attachments" data-testid="mail-list-attachments">'
			. '<span class="mail-msg-list-attachment-chip --loading" data-testid="mail-list-attachment-chip-loading">'
			. $text
			. '</span>'
			. '</div>';
	}

	private function buildAttachmentChip(array $icon): string
	{
		$url = is_string($icon['url'] ?? null) ? $icon['url'] : '';
		$content = $this->buildAttachmentChipContent($icon);

		if ($url === '')
		{
			return '<span class="mail-msg-list-attachment-chip" data-testid="mail-list-attachment-chip">'
				. '<span class="mail-msg-list-attachment-chip__open">' . $content . '</span>'
				. '</span>';
		}

		$escapedUrl = htmlspecialcharsbx($url, ENT_QUOTES);
		$viewerAttributes = is_array($icon['viewerAttrs'] ?? null) ? $icon['viewerAttrs'] : [];

		return '<span class="mail-msg-list-attachment-chip" data-testid="mail-list-attachment-chip">'
			. '<a class="mail-msg-list-attachment-chip__open" data-role="mail-list-attachment-chip"'
			. ' data-testid="mail-list-attachment-chip-open" href="' . $escapedUrl . '"'
			. ' target="_blank" rel="noopener" ' . self::SLIDER_IGNORE_ATTRIBUTE
			. $this->buildViewerAttributes($viewerAttributes) . '>'
			. $content . '</a>'
			. $this->buildAttachmentDownloadLink($escapedUrl, (string)($icon['name'] ?? ''))
			. '</span>';
	}

	private function buildAttachmentChipContent(array $icon): string
	{
		$name = htmlspecialcharsbx((string)($icon['name'] ?? ''), ENT_QUOTES);
		$size = htmlspecialcharsbx((string)($icon['size'] ?? ''), ENT_QUOTES);
		$typeIcon = Mail\Internal\Service\Attachment\FileIcon::resolve((string)($icon['extension'] ?? ''));

		// the icon repeats the extension the file name already shows, so it is decorative
		$content = '<span class="mail-msg-list-attachment-chip__type ui-icon ui-icon-file-' . $typeIcon . '"'
			. ' data-testid="mail-list-attachment-chip-type" aria-hidden="true"><i></i></span>'
			. '<span class="mail-msg-list-attachment-chip__name" title="' . $name . '">' . $name . '</span>'
		;

		if ($size !== '')
		{
			$content .= '<span class="mail-msg-list-attachment-chip__size">' . $size . '</span>';
		}

		return $content;
	}

	private function buildAttachmentDownloadLink(string $escapedUrl, string $name): string
	{
		$title = htmlspecialcharsbx(Loc::getMessage('MAIL_MESSAGE_LIST_ATTACHMENTS_DOWNLOAD'), ENT_QUOTES);
		$label = $name === ''
			? $title
			: htmlspecialcharsbx(
				Loc::getMessage('MAIL_MESSAGE_LIST_ATTACHMENTS_DOWNLOAD_FILE', ['#NAME#' => $name]),
				ENT_QUOTES,
			)
		;

		// the glyph is masked on a node of its own: a mask on the link itself cuts off its focus ring
		return '<a class="mail-msg-list-attachment-chip__download" data-testid="mail-list-attachment-chip-download"'
			. ' href="' . $escapedUrl . '" download ' . self::SLIDER_IGNORE_ATTRIBUTE
			. ' title="' . $title . '" aria-label="' . $label . '">'
			. '<span class="mail-msg-list-attachment-chip__download-icon" aria-hidden="true"></span></a>';
	}

	private function buildAttachmentsMoreChip(int $messageId, int $count, int $restCount): string
	{
		$text = (string)Loc::getMessage('MAIL_MESSAGE_LIST_ATTACHMENTS_MORE', ['#COUNT#' => $restCount]);

		// the name of the button extends its visible text instead of replacing it, and the tooltip
		// says the same thing, so the name and the description do not diverge
		$label = (string)Loc::getMessagePlural('MAIL_MESSAGE_LIST_ATTACHMENTS_MORE_LABEL', $count, [
			'#MORE#' => $text,
			'#COUNT#' => $count,
		]);
		$escapedLabel = htmlspecialcharsbx($label === '' ? $text : $label, ENT_QUOTES);

		return '<button type="button" class="mail-msg-list-attachment-chip --more"'
			. ' data-message-id="' . $messageId . '" data-role="mail-list-attachments-stack"'
			. ' data-testid="mail-list-attachments-stack" title="' . $escapedLabel . '"'
			. ' aria-label="' . $escapedLabel . '"'
			. ' aria-haspopup="dialog" aria-expanded="false">'
			. htmlspecialcharsbx($text, ENT_QUOTES) . '</button>';
	}

	/**
	 * ItemAttributes escapes the values it owns (title, group, type class), so encoding them again
	 * would show entities in the viewer; raw JSON of data-actions still has to be encoded.
	 */
	private function buildViewerAttributes(array $attributes): string
	{
		$markup = '';
		foreach ($attributes as $name => $value)
		{
			if (!is_string($name) || is_array($value))
			{
				continue;
			}

			$markup .= ' ' . htmlspecialcharsbx($name, ENT_QUOTES)
				. '="' . htmlspecialcharsbx((string)$value, ENT_QUOTES, false) . '"'
			;
		}

		return $markup;
	}

	/**
	 * @param $item array{
	 *   ID: int|string,
	 *   MESSAGE_ID: int|string,
	 *   BIND?: array<int, string>|null,
	 *   CRM_ACTIVITY_OWNER?: array<int, string>|null
	 * }
	 * @param $bindParams array{
	 *   taskHref?: string,
	 *   postHref?: string
	 * }
	 * @return array{
	 *   CRM_BIND: string,
	 *   TASK_BIND: string,
	 *   POST_BIND: string,
	 *   MEETING_BIND: string
	 * }
	 */
	private function buildBindingsColumns(array $item, array $bindParams): array
	{
		$taskHref = (string)($bindParams['taskHref'] ?? '');
		$postHref = (string)($bindParams['postHref'] ?? '');
		$bind = '<span class="mail-ui-binding-data js-bind-' . $item['MESSAGE_ID'] . '" message-id="' . $item['ID'] . '" message-simple-id="' . $item['MESSAGE_ID'] . '" ';
		$bindClose ='></span>';

		$columns = [
			'CRM_BIND' => $bind,
			'TASK_BIND' => $bind . 'create-href="' . \CUtil::jsEscape($taskHref) . '" ',
			'POST_BIND' => $bind . 'create-href="' . \CUtil::jsEscape($postHref) . '" ',
			'MEETING_BIND' => $bind,
		];

		if (!empty($item['BIND']))
		{
			foreach ((array)$item['BIND'] as $bindWithId)
			{
				[$bindEntityType, $bindEntityId] = explode('-', (string)$bindWithId);
				$bindId = $bind . 'bind-id ="' . $bindEntityId . '" ';

				switch ($bindEntityType)
				{
					case MessageAccessTable::ENTITY_TYPE_CALENDAR_EVENT:
						$bindId .= 'bind-href ="' . \CComponentEngine::makePathFromTemplate(
							$this->arParams['PATH_TO_USER_CALENDAR_EVENT'],
							[
								'event_id' => $bindEntityId,
							],
						) . '"';
						$columns['MEETING_BIND'] = $bindId;

						break;
					case MessageAccessTable::ENTITY_TYPE_TASKS_TASK:
						$taskPath = \CComponentEngine::makePathFromTemplate(
							$this->arParams['PATH_TO_USER_TASKS_TASK'],
							[
								'action' => 'view',
								'task_id' => $bindEntityId,
							],
						);

						$taskPath = AnalyticsHelper::addAnalyticsToMessage($taskPath, [
							'ta_sec' => 'mail',
							'ta_el' => 'view_button',
						]);

						$bindId .= 'bind-href ="' . $taskPath . '"';
						$columns['TASK_BIND'] = $bindId;

						break;
					case MessageAccessTable::ENTITY_TYPE_CRM_ACTIVITY:
						[$ownerTypeId, $ownerId] = explode('-', (string)end($item['CRM_ACTIVITY_OWNER']));
						$bindId .= (Loader::includeModule('crm')) ? ('bind-href ="' . \CCrmOwnerType::getEntityShowPath($ownerTypeId, $ownerId) . '"') : '';
						$columns['CRM_BIND'] = $bindId;

						break;
					case MessageAccessTable::ENTITY_TYPE_BLOG_POST:
						$bindId .= 'bind-href ="' . \CComponentEngine::makePathFromTemplate(
							$this->arParams['PATH_TO_USER_BLOG_POST'],
							[
								'post_id' => $bindEntityId,
							],
						) . '"';
						$columns['POST_BIND'] = $bindId;

						break;
				}
			}
		}

		$this->arResult['ERRORS']=[];
		$this->arResult['ERRORS']['CRM']=[];
		$this->arResult['ERRORS']['CALENDAR']=[];

		if (!ModuleManager::isModuleInstalled('crm'))
		{
			$columns['CRM_BIND'] .= 'error-type="crm-install-error" ';
			$this->arResult['ERRORS']['CRM'][] = "crm-install-error";
		}
		elseif (!$this->arResult['userHasCrmActivityPermission'])
		{
			$columns['CRM_BIND'] .= 'error-type="crm-install-permission-error" ';
		}

		if (!ModuleManager::isModuleInstalled('calendar'))
		{
			$columns['MEETING_BIND'] .= 'error-type="calendar-install-error" ';
		}

		if (!ModuleManager::isModuleInstalled('tasks'))
		{
			$columns['TASK_BIND'] .= 'error-type="tasks-install-error" ';
		}

		if (!ModuleManager::isModuleInstalled('socialnetwork'))
		{
			$columns['POST_BIND'] .= 'error-type="socialnetwork-install-error" ';
		}

		$columns['CRM_BIND'] .= ' bind-type ="crm" ' . $bindClose;
		$columns['TASK_BIND'] .= ' bind-type ="task" ' . $bindClose;
		$columns['POST_BIND'] .= ' bind-type ="post" ' . $bindClose;
		$columns['MEETING_BIND'] .= ' bind-type ="meeting" ' . $bindClose;

		return $columns;
	}

	private function buildActionColumns(array $item): array
	{
		$action = '<span class="mail-ui-action-data" message-id="' . $item['ID'] . '" message-simple-id="' . $item['MESSAGE_ID'] . '" ';
		if (!ModuleManager::isModuleInstalled('im'))
		{
			$action .= 'error-type="chat-install-error" ';
		}
		$action .= ' action-type="action" action-id="discuss_in_chat" ></span>';

		return [
			'CHAT_BIND' => $action,
		];
	}

	/**
	 * @param $item array{
	 *    ID: int|string,
	 *    MESSAGE_ID: int|string
	 *  }
	 * @param $actionParams array{
	 *   taskHref?: string,
	 *   postHref?: string
	 * }
	 *
	 * @psalm-type MailMessageListAction = array{
	 *   id: string,
	 *   text?: string,
	 *   html?: string,
	 *   title?: string,
	 *   icon?: string,
	 *   className?: string,
	 *   onclick?: string,
	 *   href?: string,
	 *   items?: array<MailMessageListAction>,
	 *   gridRowId?: int|string,
	 *   dataset?: array<string, mixed>,
	 *   additionalClassForPanel?: string,
	 *   hideInActionPanel?: bool,
	 *   selected?: bool,
	 * }
	 * @return array<MailMessageListAction>
	 */
	private function buildRowActions(array $item, array $actionParams): array
	{
		$taskHref = (string)($actionParams['taskHref'] ?? '');
		$postHref = (string)($actionParams['postHref'] ?? '');
		$actions = [
			[
				'id' => $this->arResult['gridActionsData']['notRead']['id'],
				'html' => '<span data-role="not-read-action">'
					. $this->arResult['gridActionsData']['notRead']['text']
					. '</span>',
				'text' => '<span data-role="not-read-action">'
					. $this->arResult['gridActionsData']['notRead']['text']
					. '</span>',
				'title' => $this->arResult['gridActionsData']['notRead']['title'],
				'icon' => $this->arResult['gridActionsData']['notRead']['icon'],
				'className' => "menu-popup-no-icon",
				'dataset' => ['migrationDangerous' => true],
				'onclick' => "BX.Mail.Client.Message.List['"
					. CUtil::JSEscape(static::getComponentId())
					. "'].onReadClick('{$item['ID']}');",
			],
			[
				'id' => $this->arResult['gridActionsData']['read']['id'],
				'html' =>'<span data-role="read-action">'
					. $this->arResult['gridActionsData']['read']['text']
					. '</span>',
				'text' =>'<span data-role="read-action">'
					. $this->arResult['gridActionsData']['read']['text']
					. '</span>',
				'title' => $this->arResult['gridActionsData']['read']['title'],
				'icon' => $this->arResult['gridActionsData']['read']['icon'],
				'className' => "menu-popup-no-icon",
				'dataset' => ['migrationDangerous' => true],
				'onclick' => "BX.Mail.Client.Message.List['"
					. CUtil::JSEscape(static::getComponentId())
					. "'].onReadClick('{$item['ID']}');",
			],
			...($this->isAllMailMode ? [] : [[
				'id' => $this->arResult['gridActionsData']['move']['id'] . $item['ID'],
				'icon' => $this->arResult['gridActionsData']['move']['icon'],
				'text' => $this->arResult['gridActionsData']['move']['text'],
				'title' => $this->arResult['gridActionsData']['move']['title'],
				'dataset' => ['migrationDangerous' => true],
				'items' => $this->getDirectoryHierarchyForContextMenuAction($this->mailbox['ID']),
				'gridRowId' => $item['ID'],
			]]),
			...(!empty($this->arResult['LABELS_ENABLED']) ? [[
				'id' => $this->arResult['gridActionsData']['assignLabel']['id'] . $item['ID'],
				'icon' => $this->arResult['gridActionsData']['assignLabel']['icon'],
				'text' => $this->arResult['gridActionsData']['assignLabel']['text'],
				'title' => $this->arResult['gridActionsData']['assignLabel']['title'],
				'gridRowId' => $item['ID'],
				'dataset' => ['labelMenu' => true],
				'items' => [
					[
						'id' => 'loading',
						'text' => Loc::getMessage('MAIL_CLIENT_BUTTON_LOADING'),
						'disabled' => true,
						'items' => [],
					],
				],
			]] : []),
			[
				'id' => $this->arResult['gridActionsData']['notSpam']['id'],
				'icon' => $this->arResult['gridActionsData']['notSpam']['icon'],
				'html' => '<span data-role="not-spam-action">'
					. $this->arResult['gridActionsData']['notSpam']['text']
				. '</span>',
				'text' => '<span data-role="not-spam-action">'
					. $this->arResult['gridActionsData']['notSpam']['text']
				. '</span>',
				'title' => $this->arResult['gridActionsData']['notSpam']['title'],
				'dataset' => ['migrationDangerous' => true],
				'onclick' => "BX.Mail.Client.Message.List['"
					. CUtil::JSEscape(static::getComponentId())
				. "'].onSpamClick('{$item['ID']}');",
			],
			[
				'id' => $this->arResult['gridActionsData']['spam']['id'],
				'icon' => $this->arResult['gridActionsData']['spam']['icon'],
				'html' => '<span data-role="spam-action">'
					. $this->arResult['gridActionsData']['spam']['text']
				. '</span>',
				'text' => '<span data-role="spam-action">'
					. $this->arResult['gridActionsData']['spam']['text']
				. '</span>',
				'title' => $this->arResult['gridActionsData']['spam']['title'],
				'dataset' => ['migrationDangerous' => true],
				'onclick' => "BX.Mail.Client.Message.List['"
					. CUtil::JSEscape(static::getComponentId())
				. "'].onSpamClick('{$item['ID']}');",
			],
			[
				'id' => $this->arResult['gridActionsData']['delete']['id'],
				'icon' => $this->arResult['gridActionsData']['delete']['icon'],
				'text' => $this->arResult['gridActionsData']['delete']['text'],
				'title' => $this->arResult['gridActionsData']['delete']['title'],
				'dataset' => ['migrationDangerous' => true],
				'onclick' => "BX.Mail.Client.Message.List['"
					. CUtil::JSEscape(static::getComponentId())
					. "'].onDeleteClick('{$item['ID']}');",
			],
			[
				'id' => 'separator',
				'additionalClassForPanel' => 'mail-separator',
				'hideInActionPanel' => true,
			],
		];

		if (!ModuleManager::isModuleInstalled('crm'))
		{
			$crmOnClickAction = "BX.Mail.Client.Item.showError('crm-install-error');";
		}
		elseif (!$this->arResult['userHasCrmActivityPermission'])
		{
			$crmOnClickAction = "BX.Mail.Client.Item.showError('crm-install-permission-working-error');";
		}
		else
		{
			$crmOnClickAction = "BX.Mail.Client.Message.List['"
			. CUtil::JSEscape(static::getComponentId())
			. "'].onCrmClick('{$item['ID']}');";
		}

		$actions = array_merge(
			$actions,
			[
				[
					'id' => $this->arResult['gridActionsData']['addToCrm']['id'],
					'html' => '<span data-role="crm-action">'
						. $this->arResult['gridActionsData']['addToCrm']['text']
					. '</span>',
					'text' => '<span data-role="crm-action">'
						. $this->arResult['gridActionsData']['addToCrm']['text']
					. '</span>',
					'title' => $this->arResult['gridActionsData']['addToCrm']['title'],

					'onclick' => $crmOnClickAction,
					'additionalClassForPanel' => 'mail-crm-action',
					'hideInActionPanel' => true,
				],
				[
					'id' => $this->arResult['gridActionsData']['excludeFromCrm']['id'],
					'html' => '<span data-role="not-crm-action">'
						. $this->arResult['gridActionsData']['excludeFromCrm']['text']
					. '</span>',
					'text' => '<span data-role="not-crm-action">'
						. $this->arResult['gridActionsData']['excludeFromCrm']['text']
					. '</span>',
					'title' => $this->arResult['gridActionsData']['excludeFromCrm']['title'],

					'onclick' => $crmOnClickAction,
					'additionalClassForPanel' => 'mail-not-crm-action',
					'hideInActionPanel' => true,
				],
			],
		);

		$actions = array_merge(
			$actions,
			[
				[
					'id' => $this->arResult['gridActionsData']['task']['id'],
					'text' => $this->arResult['gridActionsData']['task']['text'],
					'title' => $this->arResult['gridActionsData']['task']['title'],

					'href' => !ModuleManager::isModuleInstalled('tasks') ? '' : $taskHref,

					'onclick' => !ModuleManager::isModuleInstalled('tasks')
						? "BX.Mail.Client.Item.showError('tasks-install-error');"
						: "top.BX.SidePanel.Instance.open('"
						. \CUtil::jsEscape($taskHref)
						. "', {'cacheable': false, 'loader': 'task-new-loader'}); if (event = event || window.event) event.preventDefault(); ",

					'dataset' => ['sliderIgnoreAutobinding' => true],
					'additionalClassForPanel' => 'mail-task',
					'hideInActionPanel' => true,
				],
				[
					'id' => $this->arResult['gridActionsData']['discuss']['id'],
					'text' => $this->arResult['gridActionsData']['discuss']['text'],
					'title' => $this->arResult['gridActionsData']['discuss']['title'],
					'additionalClassForPanel' => 'mail-discuss',
					'hideInActionPanel' => true,
					'items' => [
						[
							'id' => $this->arResult['gridActionsData']['discussInChat']['id'],
							'text' => $this->arResult['gridActionsData']['discussInChat']['text'],
							'title' => $this->arResult['gridActionsData']['discussInChat']['title'],
							'onclick' => !ModuleManager::isModuleInstalled('im')
								? "BX.Mail.Client.Item.showError('chat-install-error');"
								: 'BX.Mail.Client.Action.DiscussInChat.open(' . (int)$item['MESSAGE_ID'] . ')',
						],
						[
							'id' => $this->arResult['gridActionsData']['chat']['id'],
							'text' => $this->arResult['gridActionsData']['chat']['text'],
							'title' => $this->arResult['gridActionsData']['chat']['title'],
							'onclick' => !ModuleManager::isModuleInstalled('im')
								? "BX.Mail.Client.Item.showError('chat-install-error');"
								: 'BX.Mail.Secretary.getInstance(' . htmlspecialcharsbx($item['MESSAGE_ID']) . ').openChat()',
						],
						[
							'id' => $this->arResult['gridActionsData']['liveFeed']['id'],
							'text' => $this->arResult['gridActionsData']['liveFeed']['text'],
							'title' => $this->arResult['gridActionsData']['liveFeed']['title'],
							'href' => !ModuleManager::isModuleInstalled('socialnetwork') ? '' : $postHref,

							'onclick' => !ModuleManager::isModuleInstalled('socialnetwork')
								? "BX.Mail.Client.Item.showError('socialnetwork-install-error');"
								: "top.BX.SidePanel.Instance.open('"
								. \CUtil::jsEscape($postHref)
								. "', {'cacheable': false, 'loader': 'socialnetwork:userblogposteditex'}); if (event = event || window.event) event.preventDefault(); ",

							'dataset' => ['sliderIgnoreAutobinding' => true],
						],
					],
				],
				[
					'id' => $this->arResult['gridActionsData']['event']['id'],
					'text' => $this->arResult['gridActionsData']['event']['text'],
					'additionalClassForPanel' => 'mail-meeting',
					'title' => $this->arResult['gridActionsData']['event']['title'],
					'hideInActionPanel' => true,

					'onclick' => !ModuleManager::isModuleInstalled('calendar')
						? "BX.Mail.Client.Item.showError('calendar-install-error');"
						: 'BX.Mail.Secretary.getInstance(' . htmlspecialcharsbx($item['MESSAGE_ID']) . ').openCalendarEvent()',
				],
				[
					'id' => $this->arResult['gridActionsData']['deleteImmediately']['id'],
					'text' => $this->arResult['gridActionsData']['deleteImmediately']['text'],
					'title' => $this->arResult['gridActionsData']['deleteImmediately']['title'],
					'dataset' => ['migrationDangerous' => true],
					'disabled' => $this->arResult['currentDir'] === '[Gmail]/All Mail',

					'onclick' => "BX.Mail.Client.Message.List['"
								 . CUtil::JSEscape(static::getComponentId())
								 . "'].onDeleteImmediately('{$item['ID']}');",
					'hiddenInPanel' => true,
				],
			],
		);

		return $actions;
	}

	/**
	 * @param $emails
	 *
	 * @return array
	 * @throws Main\ArgumentException
	 * @throws Main\ObjectPropertyException
	 * @throws Main\SystemException
	 */
	private function getAvatarConfigs(array|bool|float|int|string|null $items)
	{
		$emails = [];
		foreach ($items as $item)
		{
			foreach (['FIELD_FROM', 'FIELD_TO'] as $column)
			{
				if (isset($item[$column]) || $item[$column])
				{
					$emails[$item[$column]] = $item[$column];
				}
			}
		}
		$emails = array_values($emails);

		return (new AvatarManager(
			Main\Engine\CurrentUser::get()->getId(),
		))->getAvatarParamsFromEmails($emails);
	}

	private function getGridActionsData(): array
	{
		return [
			'view' => [
				'id' => 'view',
				'icon' => '/bitrix/js/ui/actionpanel/images/ui_icon_actionpanel_open_mail.svg',
				'text' => Loc::getMessage('MAIL_MESSAGE_LIST_BTN_VIEW'),
				'title' => Loc::getMessage('MAIL_MESSAGE_LIST_BTN_VIEW'),
			],
			'delete' => [
				'id' => 'delete',
				'icon' => '/bitrix/images/mail/mailservice-icon/mail-actionpanel_remove.svg',
				'text' => Loc::getMessage('MAIL_MESSAGE_LIST_BTN_DELETE'),
				'title' => Loc::getMessage('MAIL_MESSAGE_LIST_BTN_DELETE'),
			],
			'deleteImmediately' => [
				'id' => 'deleteImmediately',
				'icon' => '/bitrix/images/mail/mailservice-icon/mail-actionpanel_remove.svg',
				'text' => Loc::getMessage('MAIL_MESSAGE_LIST_BTN_DELETE_IMMEDIATELY'),
				'title' => Loc::getMessage('MAIL_MESSAGE_LIST_BTN_DELETE_IMMEDIATELY'),
			],
			'spam' => [
				'id' => 'spam',
				'icon' => '/bitrix/images/mail/mailservice-icon/mail-actionpanel_lock.svg',
				'text' => Loc::getMessage('MAIL_MESSAGE_LIST_BTN_SPAM'),
				'title' => Loc::getMessage('MAIL_MESSAGE_LIST_BTN_SPAM'),
			],
			'notSpam' => [
				'id' => 'notSpam',
				'icon' => '/bitrix/images/mail/mailservice-icon/mail-actionpanel_not_spam.svg',
				'text' => Loc::getMessage('MAIL_MESSAGE_LIST_BTN_NOT_SPAM'),
				'title' => Loc::getMessage('MAIL_MESSAGE_LIST_BTN_NOT_SPAM'),
			],
			'addToCrm' => [
				'id' => 'addToCrm',
				'icon' => '/bitrix/js/ui/actionpanel/images/ui_icon_actionpanel_save_to_crm.svg',
				'text' => Loc::getMessage('MAIL_MESSAGE_CREATE_CRM_BTN'),
				'title' => Loc::getMessage('MAIL_MESSAGE_CREATE_CRM_BTN_TITLE'),
			],
			'excludeFromCrm' => [
				'id' => 'excludeFromCrm',
				'icon' => '/bitrix/js/ui/actionpanel/images/ui_icon_actionpanel_exclude.svg',
				'text' => Loc::getMessage('MAIL_MESSAGE_CREATE_CRM_EXCLUDE_BTN'),
				'title' => Loc::getMessage('MAIL_MESSAGE_CREATE_CRM_EXCLUDE_BTN'),
			],
			'task' => [
				'id' => 'task',
				'icon' => '/bitrix/js/ui/actionpanel/images/ui_icon_actionpanel_create.svg',
				'text' => Loc::getMessage('MAIL_MESSAGE_CREATE_TASK_BTN'),
				'title' => Loc::getMessage('MAIL_MESSAGE_CREATE_TASK_BTN_TITLE'),
			],
			'event' => [
				'id' => 'event',
				'icon' => '/bitrix/js/ui/actionpanel/images/ui_icon_actionpanel_event.svg',
				'text' => Loc::getMessage('MAIL_MESSAGE_CREATE_EVENT_BTN'),
				'title' => Loc::getMessage('MAIL_MESSAGE_CREATE_EVENT_BTN_TITLE'),
			],
			'liveFeed' => [
				'id' => 'liveFeed',
				'text' => Loc::getMessage('MAIL_MESSAGE_CREATE_FEED_POST'),
				'title' => Loc::getMessage('MAIL_MESSAGE_CREATE_FEED_POST_TITLE'),
			],
			'discuss' => [
				'id' => 'discuss',
				'icon' => '/bitrix/js/ui/actionpanel/images/ui_icon_actionpanel_discuss_in_chat.svg',
				'text' => Loc::getMessage('MAIL_PANEL_DISCUSS_BTN'),
				'title' => Loc::getMessage('MAIL_PANEL_DISCUSS_BTN_TITLE'),
			],
			'chat' => [
				'id' => 'chat',
				'text' => Loc::getMessage('MAIL_MESSAGE_CREATE_IM_BTN'),
				'title' => Loc::getMessage('MAIL_MESSAGE_CREATE_IM_BTN_TITLE'),
			],
			'discussInChat' => [
				'id' => 'discussInChat',
				'text' => Loc::getMessage('MAIL_MESSAGE_DISCUSS_IN_CHAT_BTN'),
				'title' => Loc::getMessage('MAIL_MESSAGE_DISCUSS_IN_CHAT_BTN_TITLE'),
			],
			'read' => [
				'id' => 'read',
				'icon' => '/bitrix/images/mail/mailservice-icon/mail-open-envelope.svg',
				'text' => Loc::getMessage('MAIL_MESSAGE_LIST_BTN_SEEN'),
				'title' => Loc::getMessage('MAIL_MESSAGE_LIST_BTN_SEEN_TITLE'),
			],
			'notRead' => [
				'id' => 'notRead',
				'icon' => '/bitrix/images/mail/mailservice-icon/mail-closed-envelope.svg',
				'text' => Loc::getMessage('MAIL_MESSAGE_LIST_BTN_UNSEEN'),
				'title' => Loc::getMessage('MAIL_MESSAGE_LIST_BTN_UNSEEN_TITLE'),
			],
			'move' => [
				'id' => ':move:',
				'icon' => '/bitrix/images/mail/mailservice-icon/mail-actionpanel_move_to_folder.svg',
				'text' => Loc::getMessage('MAIL_MESSAGE_LIST_BTN_MOVE'),
				'title' => Loc::getMessage('MAIL_MESSAGE_LIST_BTN_MOVE'),
			],
			'assignLabel' => [
				'id' => 'assignLabel',
				'icon' => '/bitrix/images/mail/mailservice-icon/mail-actionpanel_label.svg',
				'text' => Loc::getMessage('MAIL_MESSAGE_LIST_BTN_ASSIGN_LABEL'),
				'title' => Loc::getMessage('MAIL_MESSAGE_LIST_BTN_ASSIGN_LABEL'),
			],
		];
	}

	private function getSenderColumnCell($avatarParams)
	{
		global $APPLICATION;
		static $contactAvatars = [];

		$email = !empty($avatarParams['email']) ? $avatarParams['email'] : 'default';
		$name = !empty($avatarParams['name']) ? $avatarParams['name'] : 'default';
		$key = md5($email . $name);

		if (!array_key_exists($key, $contactAvatars))
		{
			ob_start();
			$APPLICATION->includeComponent(
				'bitrix:mail.contact.avatar',
				'',
				$avatarParams,
				null,
				[
					'HIDE_ICONS' => 'Y',
				],
			);
			$contactAvatars[$key] = ob_get_clean();
		}

		return $contactAvatars[$key];

	}

	/**
	 * @return mixed[]
	 */
	private function getDirsForFilter(): array
	{
		$syncDirs = $this->mailboxHelper->getDirsHelper()->getSyncDirs();
		$dirs = [];

		foreach ($syncDirs as $syncDir)
		{
			if ($syncDir->isVirtualFolder())
			{
				continue;
			}

			$dirs[$syncDir->getPath(true)] = $syncDir->getName();
		}

		$dirs[''] = Loc::getMessage('MAIL_MESSAGE_LIST_FILTER_ANY_DIR');

		return $dirs;
	}

	private function setFilterSettings(array $dirsForFilter): void
	{
		$dirsForFilter = ['' => $dirsForFilter['']] + $dirsForFilter;

		$this->arResult['FILTER'] = [];

		if (!$this->isAllMailMode)
		{
			$this->arResult['FILTER'][] = [
				'id' => 'DIR',
				'name' => Loc::getMessage('MAIL_MESSAGE_LIST_FILTER_DIR'),
				'type' => 'list',
				'params' => ['multiple' => 'N'],
				'items' => $dirsForFilter,
				'default' => true,
				'strict' => true,
			];
		}

		$commonFilterFields = [
			[
				'id' => 'DATE',
				'name' => Loc::getMessage('MAIL_MESSAGE_LIST_FILTER_DATE'),
				'type' => 'date',
				'default' => true,
				'exclude' => [
					\Bitrix\Main\UI\Filter\DateType::TOMORROW,
					\Bitrix\Main\UI\Filter\DateType::NEXT_DAYS,
					\Bitrix\Main\UI\Filter\DateType::NEXT_WEEK,
					\Bitrix\Main\UI\Filter\DateType::NEXT_MONTH,
				],
			],
			[
				'id' => 'IS_SEEN',
				'name' => Loc::getMessage('MAIL_MESSAGE_LIST_FILTER_IS_SEEN'),
				'type' => 'list',
				'params' => ['multiple' => 'N'],
				'items' => [
					'Y' => Loc::getMessage('MAIL_MESSAGE_LIST_FILTER_OPTION_Y'),
					'N' => Loc::getMessage('MAIL_MESSAGE_LIST_FILTER_OPTION_N'),
				],
				'default' => true,
			],
			[
				'id' => 'BIND',
				'name' => Loc::getMessage('MAIL_MESSAGE_LIST_FILTER_BIND'),
				'type' => 'list',
				'default' => true,
				'params' => ['multiple' => 'N'],
				'items' => [
					MessageAccessTable::ENTITY_TYPE_CRM_ACTIVITY => Loc::getMessage(
						'MAIL_MESSAGE_LIST_FILTER_PRESET_BIND_CRM',
					),
					MessageAccessTable::ENTITY_TYPE_TASKS_TASK => Loc::getMessage(
						'MAIL_MESSAGE_LIST_FILTER_PRESET_BIND_TASK',
					),
					MessageAccessTable::ENTITY_TYPE_IM_CHAT => Loc::getMessage(
						'MAIL_MESSAGE_LIST_FILTER_PRESET_BIND_CHAT',
					),
					MessageAccessTable::ENTITY_TYPE_BLOG_POST => Loc::getMessage(
						'MAIL_MESSAGE_LIST_FILTER_PRESET_BIND_POST',
					),
					MessageAccessTable::ENTITY_TYPE_CALENDAR_EVENT => Loc::getMessage(
						'MAIL_MESSAGE_LIST_FILTER_PRESET_BIND_CALENDAR_EVENT',
					),
					MessageAccessTable::ENTITY_TYPE_NO_BIND => Loc::getMessage('MAIL_MESSAGE_LIST_FILTER_OPTION_N'),
				],
			],
			[
				'id' => 'ATTACHMENTS',
				'name' => Loc::getMessage('MAIL_MESSAGE_LIST_FILTER_ATTACHMENTS'),
				'type' => 'list',
				'default' => true,
				'params' => ['multiple' => 'N'],
				'items' => [
					'Y' => Loc::getMessage('MAIL_MESSAGE_LIST_FILTER_OPTION_Y'),
					'N' => Loc::getMessage('MAIL_MESSAGE_LIST_FILTER_OPTION_N'),
				],
			],
		];

		array_push($this->arResult['FILTER'], ...$commonFilterFields);

		if (!empty($this->arResult['LABELS_ENABLED']))
		{
			$labelItems = [];
			foreach ($this->arResult['LABELS'] as $label)
			{
				$labelItems[(string)$label['id']] = $label['name'];
			}

			$this->arResult['FILTER'][] = [
				'id' => 'LABEL_ID',
				'name' => Loc::getMessage('MAIL_MESSAGE_LIST_FILTER_LABEL'),
				'type' => 'list',
				'params' => ['multiple' => 'N'],
				'items' => $labelItems,
				'default' => false,
			];
		}
	}

	private function getUserLabels(int $userId, ?int $mailboxId): array
	{
		$result = (new LabelService())->getList($userId, $mailboxId);

		return $result->isSuccess() ? ($result->getData()['labels'] ?? []) : [];
	}

	private function setDraftFilterSettings(): void
	{
		$filterSettings = $this->getDraftFilterSettings();
		$this->arResult['FILTER'] = $filterSettings['fields'];
		$this->arResult['FILTER_PRESETS'] = $filterSettings['presets'];
	}

	private function resolveDraftAttachmentFilter(array $filterData): ?bool
	{
		return match ($filterData['ATTACHMENTS'] ?? null)
		{
			'Y' => true,
			'N' => false,
			default => null,
		};
	}

	private function getDraftFilterSettings(): array
	{
		$fields = [
			[
				'id' => 'RECIPIENT',
				'name' => Loc::getMessage('MAIL_MESSAGE_LIST_DRAFT_FILTER_TO'),
				'type' => 'string',
				'default' => true,
			],
			[
				'id' => 'ATTACHMENTS',
				'name' => Loc::getMessage('MAIL_MESSAGE_LIST_FILTER_ATTACHMENTS'),
				'type' => 'checkbox',
				'default' => true,
			],
		];
		return [
			'fields' => $fields,
			'presets' => [],
		];
	}

	/**
	 * The favorite flag left the filter fields when the favorites became a section of the list, so a
	 * value saved for it is unreachable: the interface no longer renders the field, and the component
	 * drops the value on read. A preset left with nothing but that value applies nothing at all, so it
	 * goes away with the field it was built around; presets holding anything else keep working.
	 */
	private function dropRetiredFavoriteField(array $presets): array
	{
		foreach ($presets as $presetId => $preset)
		{
			$fields = $preset['fields'] ?? null;
			if (!is_array($fields) || !array_key_exists('IS_FAVORITE', $fields))
			{
				continue;
			}

			unset($fields['IS_FAVORITE']);
			$presets[$presetId]['fields'] = $fields;

			if (isset($preset['filter_rows']) && is_string($preset['filter_rows']))
			{
				$presets[$presetId]['filter_rows'] = implode(',', array_filter(
					explode(',', $preset['filter_rows']),
					static fn (string $row): bool => trim($row) !== 'IS_FAVORITE',
				));
			}

			$applied = array_filter($fields, static fn ($value): bool => $value !== '' && $value !== null);
			if (empty($applied))
			{
				unset($presets[$presetId]);
			}
		}

		return $presets;
	}

	/**
	 * Options keeps the pinned and the applied preset as plain ids beside the presets themselves, so a
	 * preset dropped here leaves both references hanging: the screen would then open with an empty
	 * filter and the choice the user pinned silently gone. The default preset of the screen takes over.
	 */
	private function dropReferencesToMissingPresets(Main\UI\Filter\Options $filterOptions, array $presets): void
	{
		if ($this->isMissingPreset($filterOptions->getDefaultFilterId(), $presets))
		{
			$filterOptions->setDefaultPreset(
				Main\UI\Filter\Options::findDefaultPresetId($filterOptions->getDefaultPresets()),
			);
		}

		if ($this->isMissingPreset($filterOptions->getCurrentFilterId(), $presets))
		{
			// the applied preset lives in the session, where Options writes it through the settings only
			$filterOptions->setFilterSettings($filterOptions->getDefaultFilterId(), [], true, false);
		}
	}

	private function isMissingPreset(mixed $presetId, array $presets): bool
	{
		return is_string($presetId)
			&& $presetId !== ''
			&& !Main\UI\Filter\Options::isDefaultFilter($presetId)
			&& !array_key_exists($presetId, $presets)
		;
	}

	private function setFilterPresets(): void
	{
		$presetBindings = [
			'bindTask' => [
				'name' => Loc::getMessage('MAIL_MESSAGE_LIST_FILTER_PRESET_BIND_TASK'),
				'fields' => [
					'BIND' => MessageAccessTable::ENTITY_TYPE_TASKS_TASK,
				],
			],
			'bindCrm' => [
				'name' => Loc::getMessage('MAIL_MESSAGE_LIST_FILTER_PRESET_BIND_CRM'),
				'fields' => [
					'BIND' => MessageAccessTable::ENTITY_TYPE_CRM_ACTIVITY,
				],
			],
			'bindPost' => [
				'name' => Loc::getMessage('MAIL_MESSAGE_LIST_FILTER_PRESET_BIND_POST'),
				'fields' => [
					'BIND' => MessageAccessTable::ENTITY_TYPE_BLOG_POST,
				],
			],
		];

		$dirsHelper = $this->mailboxHelper->getDirsHelper();
		$presetDirs = $this->isAllMailMode ? [] : [
			'income' => [
				'name' => Loc::getMessage('MAIL_MESSAGE_LIST_FILTER_PRESET_INCOME'),
				"default" => 'true',
				'fields' => ['DIR' => $dirsHelper->getDefaultDirPath(true)],
			],
			'outcome' => [
				'name' => Loc::getMessage('MAIL_MESSAGE_LIST_FILTER_PRESET_OUTCOME'),
				'fields' => ['DIR' => $dirsHelper->getOutcomePath(true)],
			],
			'spam' => [
				'name' => Loc::getMessage('MAIL_MESSAGE_LIST_FILTER_PRESET_SPAM'),
				'fields' => ['DIR' => $dirsHelper->getSpamPath(true)],
			],
			'trash' => [
				'name' => Loc::getMessage('MAIL_MESSAGE_LIST_FILTER_PRESET_TRASH'),
				'fields' => ['DIR' => $dirsHelper->getTrashPath(true)],
			],
		];

		$defaultPresetKeys = array_keys(array_merge($presetDirs, $presetBindings));
		$defaultPresetKeys[] = '';
		$this->arResult['FILTER_PRESETS'] = [];
		$defaultPreset = [];

		foreach ($presetDirs as $presetKey => $preset)
		{
			$dirPath = $preset['fields']['DIR'];
			$dir = $this->mailboxHelper->getDirsHelper()->getDirByPath($dirPath);

			if ($dir === null)
			{
				continue;
			}

			if ($dir->isSync())
			{
				$this->arResult['FILTER_PRESETS'][$presetKey] = $preset;
			}
		}

		if (!empty($defaultPreset))
		{
			$keys = array_keys($defaultPreset);
			$values = array_values($defaultPreset);
			$this->arResult['FILTER_PRESETS'] = array_merge(
				[array_pop($keys) => array_pop($values)],
				$this->arResult['FILTER_PRESETS'],
			);
		}

		$this->arResult['FILTER_PRESETS'] += $presetBindings;
		$currentAllowedPresetKeys = array_keys($this->arResult['FILTER_PRESETS']);
		$filterOptions = new \Bitrix\Main\UI\Filter\Options(
			$this->arResult['FILTER_ID'], $this->arResult['FILTER_PRESETS'],
		);
		$userPresets = $this->dropRetiredFavoriteField($filterOptions->getPresets());
		foreach ($userPresets as $presetUserKey => $userPreset)
		{
			if (in_array($presetUserKey, $defaultPresetKeys, true))
			{
				$userPresets[$presetUserKey]['fields']['DIR'] = $this->arResult['FILTER_PRESETS'][$presetUserKey]['fields']['DIR'];
				$userPresets[$presetUserKey]['name'] = $this->arResult['FILTER_PRESETS'][$presetUserKey]['name'];
				if (!in_array($presetUserKey, $currentAllowedPresetKeys, true))
				{
					unset($userPresets[$presetUserKey]);
				}
			}
			elseif (!empty($userPreset['fields']['DIR']))
			{
				$dir = $this->mailboxHelper->getDirsHelper()->getDirByPath($userPreset['fields']['DIR']);

				if (!$dir)
				{
					unset($userPresets[$presetUserKey]);
				}
				elseif ($dir && !$dir->isSync())
				{
					unset($userPresets[$presetUserKey]);
				}
			}

			if (
				$this->isAllMailMode
				&& isset($userPresets[$presetUserKey])
				&& !in_array($presetUserKey, $currentAllowedPresetKeys, true)
				&& !empty($userPreset['fields']['DIR'])
			)
			{
				unset($userPresets[$presetUserKey]);
			}
		}

		foreach ($filterOptions->getDefaultPresets() as $key => $defaultPreset)
		{
			if (
				!array_key_exists($key, $userPresets)
				&& in_array($key, $defaultPresetKeys, true)
			)
			{
				$userPresets[$key] = $defaultPreset;
			}
		}

		$curPresets = $filterOptions->getPresets();
		if (!$this->areArraysEqual($curPresets, $userPresets))
		{
			$this->dropReferencesToMissingPresets($filterOptions, $userPresets);
			$filterOptions->setPresets($userPresets);
			$filterOptions->save();
		}
	}

	/**
	 * @deprecated Use \CMailClientMessageListComponent::getMailCountersAction
	 */
	public function getDirsWithUnseenMailCountersAction($mailboxId)
	{
		static $mailboxHelper;

		if (is_null($mailboxHelper))
		{
			$mailboxHelper = Mailbox::createInstance($mailboxId);
		}

		return $mailboxHelper->getDirsWithUnseenMailCounters();
	}

	public function getDirectoryHierarchyForContextMenuAction($mailboxId)
	{
		static $mailboxHelper;

		if (is_null($mailboxHelper))
		{
			$mailboxHelper = Mailbox::createInstance($mailboxId);
		}

		$directoriesWithNumberOfUnreadMessages = $mailboxHelper->getDirsMd5WithCounter($mailboxId);

		$currentUserId = Mail\Helper\Config\Feature::isFolderManualSortingAvailable()
			? (int)Main\Engine\CurrentUser::get()->getId()
			: null;

		return static::buildDirectoryTreeForContextMenu($mailboxHelper, $directoriesWithNumberOfUnreadMessages, $currentUserId);
	}

	private static function buildDirectoryTreeForContextMenu($mailboxHelper, array $directoriesWithNumberOfUnreadMessages, ?int $currentUserId = null)
	{
		static $directoryTreeForContextMenu;

		if (!is_null($directoryTreeForContextMenu))
		{
			return $directoryTreeForContextMenu;
		}

		$flat = [];
		$list = [];

		$dirs = $mailboxHelper->getDirsHelper($currentUserId)->getSyncDirsOrdered();

		foreach ($dirs as $dir)
		{
			$path = $dir->getPath(true);
			$hasChild = (bool)preg_match('/(HasChildren)/ix', (string)$dir->getFlags());
			$isCounted = ($dir->isTrash() || $dir->isSpam()) ? false : true;

			if ($dir->isVirtualFolder())
			{
				continue;
			}

			$flat[$dir->getId()] = [
				'id' => $path,
				'path' => $path,
				'dirId' => (int)$dir->getId(),
				'isSystem' => $dir->isSystem(),
				'delimiter' => $dir->getDelimiter(),
				'name' => htmlspecialcharsbx($dir->getName()),
				// @TODO: transfer to template
				'html' => "<span class='mail-msg-list-menu-item'>" . htmlspecialcharsbx($dir->getName()) . "</span>",
				'dataset' => [
					'path' => $path,
					'dirMd5' => $dir->getDirMd5(),
					'isDisabled' => $dir->isDisabled(),
					'hasChild' => $hasChild,
					'isCounted' => $isCounted,
				],
				// @TODO: lead to one key 'unseenCount'
				'count' => isset($directoriesWithNumberOfUnreadMessages[$dir->getDirMd5()]['UNSEEN']) ? (int)$directoriesWithNumberOfUnreadMessages[$dir->getDirMd5()]['UNSEEN'] : 0,
				'unseen' => isset($directoriesWithNumberOfUnreadMessages[$dir->getDirMd5()]['UNSEEN']) ? (int)$directoriesWithNumberOfUnreadMessages[$dir->getDirMd5()]['UNSEEN'] : 0,
				'onclick' => "BX.Mail.Client.Message.List['"
					. CUtil::JSEscape(static::getComponentId())
				. "'].onMoveToFolderClick(event)",
				'items' => $hasChild ? [
					[
						'id' => 'loading',
						'text' => Loc::getMessage('MAIL_CLIENT_BUTTON_LOADING'),
						'disabled' => true,
						'items' => [],
					],
				] : [],
			];
		}

		// Attach nodes in a second pass so nesting does not depend on the parent
		// preceding its child in the sort order (a child may be ordered first).
		foreach ($dirs as $dir)
		{
			if ($dir->isVirtualFolder())
			{
				continue;
			}

			if (!empty($flat[$dir->getParentId()]))
			{
				foreach ($flat[$dir->getParentId()]['items'] as $k => $item)
				{
					if (!empty($item['id']) && $item['id'] === 'loading')
					{
						array_splice($flat[$dir->getParentId()]['items'], $k, 1);
					}
				}

				$flat[$dir->getParentId()]['items'][] = &$flat[$dir->getId()];
			}
			else
			{
				$list[] = &$flat[$dir->getId()];
			}
		}

		$directoryTreeForContextMenu = $list;

		return $list;
	}

	private function applyAllMailFilter(array &$filterData, array $mailboxIds): void
	{
		unset($filterData['DIR']);
		$filterData['MD5_DIRS'] = MailboxDirectoryHelper::getSyncDirsMd5ForMailboxes($mailboxIds);
		/*
		 * Force FILTER_APPLIED so MessageFilter actually processes MD5_DIRS —
		 * the all-mail mode has no preset to carry the flag implicitly
		 * (the dir set is per-user and runtime, can't be baked into a static preset).
		 */
		$filterData['FILTER_APPLIED'] = 'Y';
	}

	private function areArraysEqual(array $arr1, array $arr2): bool
	{
		if (count($arr1) !== count($arr2))
		{
			return false;
		}

		foreach ($arr1 as $key => $value)
		{
			if (!array_key_exists($key, $arr2))
			{
				return false;
			}

			$compareValue = $arr2[$key];
			if (is_array($value) && is_array($compareValue))
			{
				if (!$this->areArraysEqual($value, $compareValue))
				{
					return false;
				}
			}
			elseif ($value !== $compareValue)
			{
				return false;
			}
		}

		return true;
	}

	private function rememberCurrentMailboxId($mailboxId): void
	{
		if ($this->isAllMailMode)
		{
			return;
		}

		$previousSeenMailboxId = CUserOptions::GetOption('mail', 'previous_seen_mailbox_id', null);

		if ((int)$previousSeenMailboxId !== (int)$mailboxId)
		{
			CUserOptions::SetOption('mail', 'previous_seen_mailbox_id', $mailboxId);
		}
	}

	private function rememberLastViewState(): void
	{
		$state = $this->isAllMailMode ? MessageFolder::VIRTUAL_ALL_MESSAGES : MessageFolder::VIEW_STATE_MAILBOX;
		$current = CUserOptions::GetOption('mail', 'last_view_state', null);

		if ($current !== $state)
		{
			CUserOptions::SetOption('mail', 'last_view_state', $state);
		}
	}

	/**
	 * Getting array of errors.
	 * @return Main\Error[]
	 */
	final public function getErrors()
	{
		return $this->errorCollection->toArray();
	}

	/**
	 * Getting once error with the necessary code.
	 * @param string $code Code of error.
	 * @return Main\Error|null
	 */
	final public function getErrorByCode($code)
	{
		return $this->errorCollection->getErrorByCode($code);
	}

	private function hasAccessToMailboxGrid(): bool
	{
		return Mail\Helper\MailAccess::hasCurrentUserAccessToMailboxGrid();
	}

	private function hasAccessToAccessRights(): bool
	{
		return Mail\Helper\MailAccess::hasCurrentUserAccessToPermission();
	}

	private function needShowMailboxGridHint(): bool
	{
		return !Mail\Helper\Config\Guide::wasMailboxGridGuideShown();
	}

	private function needShowDiscussInChatGuide(): bool
	{
		return !Mail\Helper\Config\Guide::wasDiscussInChatGuideShown();
	}

	private function getPendingConnectionRequestsCount(): int
	{
		return (new Mail\Helper\Mailbox\MailboxConnectionRequestService())->getPendingCount();
	}

	private function getMailboxGridButtonCounter(int $userId): int
	{
		if ($userId <= 0)
		{
			return 0;
		}

		return (new MailboxGridCounterAggregator())->getButtonCounter($userId);
	}
}
