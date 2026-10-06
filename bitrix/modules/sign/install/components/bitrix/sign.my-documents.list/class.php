<?php

if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Main\Application;
use Bitrix\Sign\Config\User;
use Bitrix\Main\Engine\CurrentUser;
use Bitrix\Main\Grid;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\UI\Filter;
use Bitrix\Main\Loader;
use Bitrix\Sign\Factory\MyDocumentsGrid\MyDocumentsFilterFactory;
use Bitrix\Sign\Integration\Bitrix24\B2eTariff;
use Bitrix\Sign\Item\MyDocumentsGrid\MyDocumentsFilter;
use Bitrix\Sign\Service\B2e\MyDocumentsGrid\DataService;
use Bitrix\Sign\Service\Container;
use Bitrix\Sign\Service\CounterService;
use Bitrix\Sign\Type\CounterType;
use Bitrix\Sign\Type\MyDocumentsGrid\ActorRole;
use Bitrix\Sign\Type\MyDocumentsGrid\FilterStatus;
use Bitrix\Sign\Util\UI\PageNavigation;
use Bitrix\UI\Buttons\Button;
use Bitrix\UI\Buttons\CreateButton;
use Bitrix\UI\Toolbar\ButtonLocation;
use Bitrix\UI\Toolbar\Facade\Toolbar;
use Bitrix\Sign\Config\Feature;
use Bitrix\Sign\FeatureResolver;

Loc::loadMessages(__FILE__);

CBitrixComponent::includeComponentClass('bitrix:sign.base');

class SignMyDocumentsComponent extends SignBaseComponent
{
	private const DEFAULT_PAGE_SIZE = 10;
	private const PAGE_SIZES = [10, 20, 50];
	private const DEFAULT_NAV_KEY = "sign-my-documents-list-nav";
	private const DEFAULT_GRID_ID = 'SIGN_B2E_MY_DOCUMENTS_GRID';
	private const DEFAULT_FILTER_ID = 'SIGN_B2E_MI_DOCUMENTS_FILTER';
	private const PARAM_FILTER_ID = 'FILTER_ID';
	private const RESULT_FILTER = 'FILTER';
	private const RESULT_FILTER_PRESETS = 'FILTER_PRESETS';
	private const COUNTER_PANEL_DELIMITER = '__';
	private const FILTER_PRESET_SIGNED = 'preset_signed';
	private const FILTER_PRESET_IN_PROGRESS = 'preset_in_progress';
	private const SIGN_B2E_MY_DOCUMENTS_CREATE_BUTTON_CLASS = 'sign_b2e_my_documents_create_button';
	private const SIGN_B2E_MY_DOCUMENTS_SALARY_AND_VACATION_BUTTON_CLASS = 'sign-grid-salary-and-vacation-button';
	private readonly DataService $myDocumentService;
	private readonly CounterService $counterService;
	private ?MyDocumentsFilter $filter = null;
	private bool $isFilterResolved = false;
	private ?int $pageSize = null;
	private ?bool $isBulkActionAvailable = null;

	public function __construct($component = null)
	{
		parent::__construct($component);
		$this->myDocumentService = Container::instance()->getMyDocumentService();
		$this->counterService = Container::instance()->getCounterService();
	}

	public function executeComponent(): void
	{
		if (!\Bitrix\Sign\Config\Storage::instance()->isB2eAvailable())
		{
			$this->includeNotAvailableTemplate();
			return;
		}

		$userId = (int)CurrentUser::get()->getId();
		if (!$userId || !User::instance()->canUserParticipateInSigning($userId))
		{
			showError('access denied');

			return;
		}

		$this->prepareNavigationParams();
		$this->prepareComponentParams();
		$this->addCreateButton();
		$this->addSalaryAndVacationButton();

		parent::executeComponent();
	}

	private function addCreateButton(): void
	{
		if (!Feature::instance()->isSendDocumentByEmployeeEnabled())
		{
			return;
		}

		$button = new CreateButton();
		$button->setText(Loc::getMessage('SIGN_B2E_MY_DOCUMENTS_CREATE_BUTTON_TITLE') ?? '');
		$button->addClass(self::SIGN_B2E_MY_DOCUMENTS_CREATE_BUTTON_CLASS);
		if (B2eTariff::instance()->isB2eRestrictedInCurrentTariff())
		{
			$button->setIcon(\Bitrix\UI\Buttons\Icon::LOCK);
			$button->setTag('button');
		}

		Toolbar::addButton($button, ButtonLocation::AFTER_TITLE);
	}

	private function addSalaryAndVacationButton(): void
	{
		if (
			!Feature::instance()->isSendDocumentByEmployeeEnabled()
			|| !Container::instance()->getHcmLinkService()->isAvailable()
			|| !Loader::includeModule('humanresources')
			|| !method_exists(\Bitrix\HumanResources\Service\Container::class, 'getHcmLinkSalaryAndVacationService')
		)
		{
			return;
		}

		$userId = CurrentUser::get()->getId();
		if (!$userId)
		{
			return;
		}

		$salaryAndVacationService = \Bitrix\HumanResources\Service\Container::getHcmLinkSalaryAndVacationService();

		$this->setParam(
			'SALARY_VACATION_SETTINGS',
			$salaryAndVacationService->getSettingsForFrontendByUser($userId)
		);

		$button = new Button();
		$button->addClass(self::SIGN_B2E_MY_DOCUMENTS_SALARY_AND_VACATION_BUTTON_CLASS);
		$button->setText(Loc::getMessage('SIGN_B2E_MY_DOCUMENTS_SALARY_AND_VACATION_BUTTON_TITLE') ?? '');
		$button->setDropdown();
		$button->setColor(\Bitrix\UI\Buttons\Color::PRIMARY);
		$button->setStyle(\Bitrix\UI\Buttons\AirButtonStyle::FILLED);

		if (
			!$salaryAndVacationService->isConfigured()
			|| !$salaryAndVacationService->isAvailableForUser($userId)
		)
		{
			$button->setDisabled();
			$button->setDropdown(false);
		}

		Toolbar::addButton($button, ButtonLocation::AFTER_FILTER);
	}

	private function getOffsetForQuery(): int
	{
		return (int)$this->getNavigation()->getOffset();
	}

	private function getLimitForQuery(): int
	{
		return (int)$this->getNavigation()->getLimit();
	}

	private function getNavigation()
	{
		if (!isset($this->arResult['NAVIGATION_OBJECT']))
		{
			return $this->prepareNavigation();
		}

		return $this->arResult['NAVIGATION_OBJECT'];
	}

	private function getPageNavigation(int $userId, ?MyDocumentsFilter $filter = null): PageNavigation
	{
		$totalCountMembers = $this->myDocumentService->getTotalCountMembers($userId, $filter);

		$pageNavigation = new PageNavigation($this->getNavigationKey());
		$pageNavigation->setPageSize($this->getPageSize())
			->setRecordCount($totalCountMembers)
			->allowAllRecords(false)
			->initFromUri()
		;

		return $pageNavigation;
	}

	private function prepareNavigation(): PageNavigation
	{
		$pageNavigation = new PageNavigation($this->getNavigationKey());
		$pageNavigation
			->setPageSize($this->getPageSize())
			->allowAllRecords(false)
			->initFromUri()
		;
		$this->arResult['NAVIGATION_OBJECT'] = $pageNavigation;

		return $pageNavigation;
	}

	private function prepareNavigationParams(): void
	{
		$this->setResult('NAVIGATION_KEY', $this->getNavigationKey());
	}

	private function getNavigationKey(): string
	{
		return (string)($this->getParam('NAVIGATION_KEY') ?? self::DEFAULT_NAV_KEY);
	}

	private function prepareComponentParams(): void
	{
		global $USER;
		$userId = $USER->IsAuthorized() ? (int)$USER->getId() : null;

		$this->setParam(
			'SIGN_B2E_MY_DOCUMENTS_CREATE_BUTTON_CLASS',
			self::SIGN_B2E_MY_DOCUMENTS_CREATE_BUTTON_CLASS
		);

		$this->setParam(
			'SIGN_B2E_MY_DOCUMENTS_SALARY_VACATION_BUTTON_CLASS',
			self::SIGN_B2E_MY_DOCUMENTS_SALARY_AND_VACATION_BUTTON_CLASS,
		);

		$this->setParam('IS_B2E_FROM_EMPLOYEE_ENABLED', Feature::instance()->isSendDocumentByEmployeeEnabled());
		$this->setResult('SEND_DOCUMENT_BY_EMPLOYEE_ANALYTIC_CONTEXT', $this->getSendDocumentByEmployeeAnalyticContext());
		$this->setParam(
			'IS_B2E_AVAILIBLE_IN_CURENT_TARIFF',
			!B2eTariff::instance()->isB2eRestrictedInCurrentTariff(),
		);

		$this->setParam('GRID_ID', self::DEFAULT_GRID_ID);
		$this->setParam('COLUMNS', $this->getGridColumnList());
		$this->setParam('PAGE_SIZES', $this->getPageSizeVariants());
		$this->setParam('DEFAULT_PAGE_SIZE', self::DEFAULT_PAGE_SIZE);
		// the size switch belongs to the bulk actions - the selection is bound to the page, so a page of
		// 50 exists to process 50 at once. Without them the list looks the way it did before the feature.
		$this->setParam('SHOW_PAGESIZE', $this->isBulkActionAvailable());
		// row checkboxes, the action panel and the size switch follow this single portal wide flag: the
		// panel lives in the page toolbar, which the grid does not redraw over AJAX, so a mode decided
		// by the rows of the current page would cost a full page reload on every paging
		$this->setParam('IS_BULK_ACTION_AVAILABLE', $this->isBulkActionAvailable());
		$this->setParam('IS_ANNUL_MARK_ENABLED', $this->isAnnulMarkFeatureEnabled());
		$this->setParam(self::PARAM_FILTER_ID, self::DEFAULT_FILTER_ID);

		$this->setResult('TITLE', Loc::getMessage('SIGN_B2E_MY_DOCUMENTS_TITLE'));
		$this->setResult(self::RESULT_FILTER, $this->getFilters());
		$this->setResult(self::RESULT_FILTER_PRESETS, $this->getFilterPresets($userId));

		$filter = $this->getFilter();
		$this->setResult('PAGE_SIZE', $this->getPageSize());
		$this->setResult('PAGE_NAVIGATION', $this->getPageNavigation($userId, $filter));
		$this->setResult('TOTAL_COUNT', $this->myDocumentService->getTotalCountMembers($userId, $filter));

		$gridData = $this->myDocumentService->getGridData(
			$this->getLimitForQuery(),
			$this->getOffsetForQuery(),
			$userId,
			$filter,
		);
		$bulkActionsByMemberId = $this->getBulkActionsByMemberId($gridData);
		$this->setResult('DOCUMENTS', $gridData);
		$this->setResult('BULK_ACTIONS', $bulkActionsByMemberId);
		$this->setResult('COUNTER_ITEMS', $this->getCounterItems($userId, $filter));
		$this->setResult('NEED_ACTION_COUNTER_ID', $this->getNeedActionCounterId());

		$pullEventName = $this->counterService->getPullEventName(CounterType::SIGN_B2E_MY_DOCUMENTS);
		$this->setResult('COUNTER_PULL_EVENT_NAME', $pullEventName);
	}

	private function getPageSize(): int
	{
		return $this->pageSize ??= $this->getConfiguredPageSize();
	}

	private function isBulkActionAvailable(): bool
	{
		return $this->isBulkActionAvailable ??= \Bitrix\Sign\Config\Storage::instance()
			->isB2eBulkActionAvailable()
		;
	}

	/**
	 * The page size comes from the grid options, which are written by the client, so anything outside the
	 * offered sizes falls back to the default. Without the bulk actions the size switch is gone, and a
	 * size picked while they were available would stay with no way back through the interface, so the
	 * list returns to the size it had before the feature and picks the choice up again once it is back.
	 */
	private function getConfiguredPageSize(): int
	{
		if (!$this->isBulkActionAvailable())
		{
			return self::DEFAULT_PAGE_SIZE;
		}

		$navParams = (new Grid\Options(self::DEFAULT_GRID_ID))
			->getNavParams(['nPageSize' => self::DEFAULT_PAGE_SIZE])
		;
		$pageSize = (int)$navParams['nPageSize'];

		return in_array($pageSize, self::PAGE_SIZES, true) ? $pageSize : self::DEFAULT_PAGE_SIZE;
	}

	/**
	 * @return list<array{NAME: string, VALUE: string}>
	 */
	private function getPageSizeVariants(): array
	{
		return array_map(
			static fn (int $pageSize): array => ['NAME' => (string)$pageSize, 'VALUE' => (string)$pageSize],
			self::PAGE_SIZES,
		);
	}

	/**
	 * @return array<int, list<string>>
	 */
	private function getBulkActionsByMemberId(\Bitrix\Sign\Item\MyDocumentsGrid\Grid $grid): array
	{
		if (!$this->isBulkActionAvailable())
		{
			return [];
		}

		$actionStatusService = Container::instance()->getActionStatusService();
		$actionsByMemberId = [];
		foreach ($grid->rows as $row)
		{
			$actionsByMemberId[$row->id] = array_map(
				static fn (\Bitrix\Sign\Type\MyDocumentsGrid\BulkAction $action): string => $action->value,
				$actionStatusService->getAvailableBulkActions($row->action, $row->document->status),
			);
		}

		return $actionsByMemberId;
	}

	private function getGridColumnList(): array
	{
		$columns = [
			[
				'id' => 'ID',
				'name' => (string)Loc::getMessage('SIGN_B2E_MY_DOCUMENTS_LIST_COLUMN_ID'),
				'default' => false,
			],
			[
				'id' => 'TITLE',
				'name' => (string)Loc::getMessage('SIGN_B2E_MY_DOCUMENTS_LIST_COLUMN_TITLE'),
				'default' => true,
			],
			[
				'id' => 'MEMBERS',
				'name' => (string)Loc::getMessage('SIGN_B2E_MY_DOCUMENTS_LIST_COLUMN_MEMBERS'),
				'default' => true,
			],
		];

		$columns[] = [
			'id' => 'ACTION',
			'name' => (string)Loc::getMessage('SIGN_B2E_MY_DOCUMENTS_LIST_COLUMN_ACTION'),
			'default' => true,
			// the cell holds action buttons and links: a click there means the action, not the selection of the row
			'prevent_default' => false,
		];

		return $columns;
	}

	private function isAnnulMarkFeatureEnabled(): bool
	{
		return FeatureResolver::instance()->released('kedoDocumentAnnul');
	}

	private function getFilters(): array
	{
		return [
			MyDocumentsFilterFactory::ROLE => [
				'id' => MyDocumentsFilterFactory::ROLE,
				'name' => Loc::getMessage('SIGN_B2E_MY_DOCUMENTS_MY_ROLE'),
				'type' => 'list',
				'default' => true,
				'items' => $this->getMyRoleItems(),
			],
			MyDocumentsFilterFactory::INITIATOR => [
				'id' => MyDocumentsFilterFactory::INITIATOR,
				'name' => Loc::getMessage('SIGN_B2E_MY_DOCUMENTS_FROM_WHOM'),
				'type' => 'entity_selector',
				'partial' => true,
				'default' => true,
				'params' => $this->getUserEntitySelectorDefaultParams(),
			],
			MyDocumentsFilterFactory::EDITOR => [
				'id' => MyDocumentsFilterFactory::EDITOR,
				'name' => Loc::getMessage('SIGN_B2E_MY_DOCUMENTS_FILTER_EDITOR'),
				'type' => 'entity_selector',
				'partial' => true,
				'default' => true,
				'params' => $this->getUserEntitySelectorDefaultParams(),
			],
			MyDocumentsFilterFactory::REVIEWER => [
				'id' => MyDocumentsFilterFactory::REVIEWER,
				'name' => Loc::getMessage('SIGN_B2E_MY_DOCUMENTS_FILTER_REVIEWER'),
				'type' => 'entity_selector',
				'partial' => true,
				'default' => true,
				'params' => $this->getUserEntitySelectorDefaultParams(),
			],
			MyDocumentsFilterFactory::SIGNER => [
				'id' => MyDocumentsFilterFactory::SIGNER,
				'name' => Loc::getMessage('SIGN_B2E_MY_DOCUMENTS_FILTER_SIGNER'),
				'type' => 'entity_selector',
				'partial' => true,
				'default' => true,
				'params' => $this->getUserEntitySelectorDefaultParams(),
			],
			MyDocumentsFilterFactory::STATUS => [
				'id' => MyDocumentsFilterFactory::STATUS,
				'name' => Loc::getMessage('SIGN_B2E_MY_DOCUMENTS_FILTER_STATUS'),
				'type' => 'list',
				'default' => true,
				'items' => $this->getStatusFilterItems(),
				'params' => [
					'multiple' => 'Y',
				],
			],
			MyDocumentsFilterFactory::DATE_MODIFY => [
				'id' => MyDocumentsFilterFactory::DATE_MODIFY,
				'name' => Loc::getMessage('SIGN_B2E_MY_DOCUMENTS_FILTER_DATE_MODIFY'),
				'type' => 'date',
				'default' => false,
			],
			MyDocumentsFilterFactory::COMPANY => [
				'id' => MyDocumentsFilterFactory::COMPANY,
				'name' => Loc::getMessage('SIGN_B2E_MY_DOCUMENTS_FILTER_COMPANY'),
				'type' => 'entity_selector',
				'partial' => true,
				'default' => true,
				'params' => [
					'multiple' => 'Y',
					'dialogOptions' => [
						'height' => 240,
						'dropdownMode' => false,
						'entities' => [
							[
								'id' => 'sign-mycompany',
								'dynamicLoad' => true,
								'dynamicSearch' => true,
								'options' => [
									'enableMyCompanyOnly' => true,
								],
							],
						],
					],
				],
			],
		];
	}

	/**
	 * @return array<string, string>
	 */
	private function getStatusFilterItems(): array
	{
		$items = [
			FilterStatus::SIGNED->value => Loc::getMessage('SIGN_B2E_MY_DOCUMENTS_FILTER_STATUS_SIGNED'),
			FilterStatus::IN_PROGRESS->value => Loc::getMessage('SIGN_B2E_MY_DOCUMENTS_FILTER_STATUS_IN_PROGRESS'),
			FilterStatus::NEED_ACTION->value => Loc::getMessage('SIGN_B2E_MY_DOCUMENTS_FILTER_STATUS_NEED_ACTION'),
			FilterStatus::MY_REVIEW->value => Loc::getMessage('SIGN_B2E_MY_DOCUMENTS_FILTER_STATUS_MY_REVIEW'),
			FilterStatus::MY_SIGNED->value => Loc::getMessage('SIGN_B2E_MY_DOCUMENTS_FILTER_STATUS_MY_SIGNED'),
			FilterStatus::MY_EDITED->value => Loc::getMessage('SIGN_B2E_MY_DOCUMENTS_FILTER_STATUS_MY_EDITED'),
			FilterStatus::MY_STOPPED->value => Loc::getMessage('SIGN_B2E_MY_DOCUMENTS_FILTER_STATUS_MY_STOPPED'),
			FilterStatus::STOPPED->value => Loc::getMessage('SIGN_B2E_MY_DOCUMENTS_FILTER_STATUS_STOPPED'),
		];

		// The annulled status becomes selectable only when the feature is enabled;
		// the query builder excludes annulled documents unless this value is chosen.
		if ($this->isAnnulMarkFeatureEnabled())
		{
			$items[FilterStatus::ANNULLED->value] =
				Loc::getMessage('SIGN_B2E_MY_DOCUMENTS_FILTER_STATUS_ANNULLED');
		}

		return $items;
	}

	private function getFilterPresets(int $userId): array
	{
		$isSignedDefault = $this->myDocumentService->isSignedExists($userId)
			&& !$this->myDocumentService->isInProgressExists($userId);

		$this->replaceDefaultPresetIfNeed($isSignedDefault);

		$presets = [
			self::FILTER_PRESET_SIGNED => [
				'name' => Loc::getMessage('SIGN_B2E_MY_DOCUMENTS_FILTER_PRESET_SIGNED'),
				'default' => $isSignedDefault,
				'fields' => [
					MyDocumentsFilterFactory::STATUS => [FilterStatus::SIGNED->value],
				],
			],
			self::FILTER_PRESET_IN_PROGRESS => [
				'name' => Loc::getMessage('SIGN_B2E_MY_DOCUMENTS_FILTER_PRESET_IN_PROGRESS'),
				'default' => !$isSignedDefault,
				'fields' => [
					MyDocumentsFilterFactory::STATUS => [FilterStatus::IN_PROGRESS->value],
				],
			],
			'preset_need_action' => [
				'name' => Loc::getMessage('SIGN_B2E_MY_DOCUMENTS_FILTER_PRESET_NEED_ACTION'),
				'default' => false,
				'fields' => [
					MyDocumentsFilterFactory::STATUS => [FilterStatus::NEED_ACTION->value],
				],
			],
			'preset_my_action_done' => [
				'name' => Loc::getMessage('SIGN_B2E_MY_DOCUMENTS_FILTER_PRESET_MY_ACTION_DONE'),
				'default' => false,
				'fields' => [
					MyDocumentsFilterFactory::STATUS => [
						FilterStatus::MY_SIGNED->value,
						FilterStatus::MY_REVIEW->value,
						FilterStatus::MY_EDITED->value,
						FilterStatus::MY_STOPPED->value,
					],
				],
			],
		];

		if (Feature::instance()->isSendDocumentByEmployeeEnabled())
		{
			$presets += [
				'preset_sent' => [
					'name' => Loc::getMessage('SIGN_B2E_MY_DOCUMENTS_FILTER_PRESET_SENT'),
					'default' => false,
					'fields' => [
						MyDocumentsFilterFactory::ROLE => ActorRole::INITIATOR->value,
					],
				],
			];
		}

		// The annulled preset surfaces annulled documents; it is added only when the
		// feature is enabled and never becomes the default (default stays "signed").
		if ($this->isAnnulMarkFeatureEnabled())
		{
			$presets += [
				'preset_annulled' => [
					'name' => Loc::getMessage('SIGN_B2E_MY_DOCUMENTS_FILTER_PRESET_ANNULLED'),
					'default' => false,
					'fields' => [
						MyDocumentsFilterFactory::STATUS => [FilterStatus::ANNULLED->value],
					],
				],
			];
		}

		return $presets;
	}

	private function getFilterOptions(): Filter\Options
	{
		return new Filter\Options(
			$this->getParam(self::PARAM_FILTER_ID),
			$this->getResult(self::RESULT_FILTER_PRESETS)
		);
	}

	private function getRequestFilters(): array
	{
		return $this->getFilterOptions()->getFilter($this->getResult(self::RESULT_FILTER));
	}

	private function getFilter(): ?MyDocumentsFilter
	{
		if (!$this->isFilterResolved)
		{
			$this->filter = $this->getFilterFromRequest();
			$this->isFilterResolved = true;
		}

		return $this->filter;
	}

	private function getFilterFromRequest(): ?MyDocumentsFilter
	{
		return (new MyDocumentsFilterFactory())
			->createFromRequestFilterOptions(
				(int)CurrentUser::get()->getId(),
				$this->getRequestFilters(),
			);
	}

	private function getUserEntitySelectorDefaultParams(): array
	{
		return [
			'multiple' => 'Y',
			'dialogOptions' => [
				'height' => 240,
				'context' => 'filter',
				'entities' => [
					[
						'id' => 'user',
						'options' => [
							'inviteEmployeeLink' => false,
						],
					],
				],
			],
		];
	}

	private function getCounterItems(int $userId, ?MyDocumentsFilter $filter = null): array
	{
		$needActionCount = $this->myDocumentService->getTotalCountNeedAction($userId);

		$isActive = $filter?->isFilterOnlyNeedAction() ?? false;

		return [
			[
				'id' => $this->getNeedActionCounterId(),
				'title' => Loc::getMessage('SIGN_MY_DOCUMENT_LIST_GRID_COUNTER_NEED_ACTION'),
				'value' => $needActionCount,
				'color' => $needActionCount > 0 ? 'DANGER' : 'THEME',
				'isRestricted' => false,
				'isActive' => $isActive,
			],
		];
	}

	private function replaceDefaultPresetIfNeed(bool $isSignedDefault): void
	{
		$options = $this->getFilterOptions();
		$defaultPreset = $options->getDefaultFilterId();
		if ($isSignedDefault && $defaultPreset === self::FILTER_PRESET_IN_PROGRESS)
		{
			$options->setDefaultPreset(self::FILTER_PRESET_SIGNED);
			$options->save();
		}
		elseif (!$isSignedDefault && $defaultPreset === self::FILTER_PRESET_SIGNED)
		{
			$options->setDefaultPreset(self::FILTER_PRESET_IN_PROGRESS);
			$options->save();
		}
	}

	private function getNeedActionCounterId(): string
	{
		return MyDocumentsFilterFactory::STATUS . self::COUNTER_PANEL_DELIMITER . FilterStatus::NEED_ACTION->value;
	}

	/**
	 * @return array<string, string>
	 */
	private function getMyRoleItems(): array
	{
		$items = [];
		if (Feature::instance()->isSendDocumentByEmployeeEnabled())
		{
			$items += [ActorRole::INITIATOR->value => Loc::getMessage('SIGN_B2E_MY_DOCUMENTS_MY_ROLE_SENDER')];
		}

		$items += [
			ActorRole::SIGNER->value => Loc::getMessage('SIGN_B2E_MY_DOCUMENTS_MY_ROLE_SIGNER'),
			ActorRole::ASSIGNEE->value => Loc::getMessage('SIGN_B2E_MY_DOCUMENTS_MY_ROLE_ASSIGNEE'),
			ActorRole::REVIEWER->value => Loc::getMessage('SIGN_B2E_MY_DOCUMENTS_MY_ROLE_REVIEWER'),
			ActorRole::EDITOR->value => Loc::getMessage('SIGN_B2E_MY_DOCUMENTS_MY_ROLE_EDITOR'),
		];

		return $items;
	}

	private function getSendDocumentByEmployeeAnalyticContext(): array
	{
		$requestedPage = Application::getInstance()->getContext()->getRequest()->getRequestedPage();
		$cSection = null;
		if (str_starts_with($requestedPage, '/sign/b2e/my-documents'))
		{
			$cSection = 'sign';
		}
		elseif (str_starts_with($requestedPage, '/company/personal/user/'))
		{
			$cSection = 'profile';
		}

		return [
			'category' => 'documents',
			'c_section' => $cSection,
			'type' => 'from_employee',
		];
	}
}
