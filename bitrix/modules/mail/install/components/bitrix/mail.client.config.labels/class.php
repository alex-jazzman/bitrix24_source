<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Mail\Helper\Label\LabelsFeature;
use Bitrix\Mail\Internal\Service\Label\LabelService;
use Bitrix\Mail\MailboxTable;
use Bitrix\Main\Context;
use Bitrix\Main\Engine\CurrentUser;
use Bitrix\Main\Loader;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\UI\Filter\Options;
use Bitrix\Main\Web\Uri;

Loc::loadMessages(__FILE__);

class CMailClientConfigLabelsComponent extends CBitrixComponent
{
	private const GRID_ID = 'mail-label-config-grid';
	private const FILTER_ID = 'mail-label-config-filter';

	public function executeComponent()
	{
		global $APPLICATION;

		if (!Loader::includeModule('mail'))
		{
			ShowError(Loc::getMessage('MAIL_CLIENT_CONFIG_LABELS_MODULE_ERROR'));

			return;
		}

		$userId = (int)CurrentUser::get()->getId();
		if ($userId <= 0)
		{
			$APPLICATION->authForm('');

			return;
		}

		if (!LabelsFeature::isEnabled())
		{
			ShowError(Loc::getMessage('MAIL_CLIENT_CONFIG_LABELS_DISABLED'));

			return;
		}

		$request = Context::getCurrent()->getRequest();

		if ($request->getQuery('form') === 'y')
		{
			$this->prepareForm($userId, (int)$request->getQuery('id'));
			$APPLICATION->setTitle($this->arResult['TITLE']);
			$this->includeComponentTemplate('form');

			return;
		}

		$mailboxOptions = $this->getMailboxOptions($userId);
		$mailboxNames = $this->mailboxNamesFromOptions($mailboxOptions);

		$requestFilter = $this->getRequestFilter($mailboxOptions);
		$hasActiveFilter = $requestFilter['search'] !== '' || $requestFilter['mailboxId'] !== null;
		$labels = $this->filterLabels($this->fetchLabels($userId), $requestFilter);

		$this->arResult['GRID'] = $this->prepareGrid($labels, $mailboxNames, $hasActiveFilter);
		$this->arResult['GRID_ID'] = self::GRID_ID;
		$this->arResult['FILTER'] = $this->prepareFilter($mailboxOptions);
		$this->arResult['LABEL_NAMES'] = $this->getLabelNames($labels);
		$this->arResult['FORM_URL'] = $this->getFormUrl();
		$this->arResult['TITLE'] = Loc::getMessage('MAIL_CLIENT_CONFIG_LABELS_TITLE');

		$APPLICATION->setTitle($this->arResult['TITLE']);

		$this->includeComponentTemplate();
	}

	private function prepareForm(int $userId, int $editId): void
	{
		$mailboxOptions = $this->getMailboxOptions($userId);
		$mailboxNames = $this->mailboxNamesFromOptions($mailboxOptions);

		$editLabel = $editId > 0 ? $this->findLabel($userId, $editId) : null;
		$isEdit = $editLabel !== null;
		$mailboxId = $isEdit ? (int)($editLabel['mailboxId'] ?? 0) : 0;

		$this->arResult['EDIT_ID'] = $isEdit ? $editId : 0;
		$this->arResult['EDIT_NAME'] = $isEdit ? (string)$editLabel['name'] : '';
		$this->arResult['MAILBOXES'] = $mailboxOptions;
		$this->arResult['EDIT_MAILBOX_ID'] = $mailboxId;
		$this->arResult['EDIT_MAILBOX_NAME'] = $this->mailboxDisplayName($mailboxId, $mailboxNames);
		$this->arResult['TITLE'] = Loc::getMessage(
			$isEdit ? 'MAIL_LABEL_CONFIG_FORM_TITLE_EDIT' : 'MAIL_LABEL_CONFIG_FORM_TITLE_CREATE'
		);
	}

	private function findLabel(int $userId, int $labelId): ?array
	{
		foreach ($this->fetchLabels($userId) as $label)
		{
			if ((int)$label['id'] === $labelId)
			{
				return $label;
			}
		}

		return null;
	}

	private function fetchLabels(int $userId): array
	{
		$listResult = (new LabelService())->getList($userId);

		return $listResult->isSuccess() ? ($listResult->getData()['labels'] ?? []) : [];
	}

	private function getLabelNames(array $labels): array
	{
		$names = [];
		foreach ($labels as $label)
		{
			$names[(int)$label['id']] = (string)$label['name'];
		}

		return $names;
	}

	/**
	 * @return array<int, array{id: int, name: string}>
	 */
	private function getMailboxOptions(int $userId): array
	{
		$options = [];
		foreach (MailboxTable::getUserMailboxes($userId) as $mailbox)
		{
			$mailboxId = (int)($mailbox['ID'] ?? 0);
			if ($mailboxId <= 0)
			{
				continue;
			}

			$options[] = [
				'id' => $mailboxId,
				'name' => $this->getMailboxDisplayName($mailbox),
			];
		}

		return $options;
	}

	/**
	 * @param array<int, array{id: int, name: string}> $mailboxOptions
	 */
	private function prepareFilter(array $mailboxOptions): array
	{
		return [
			'FILTER_ID' => self::FILTER_ID,
			'GRID_ID' => self::GRID_ID,
			'FILTER' => $this->getFilterFields($mailboxOptions),
			'ENABLE_LIVE_SEARCH' => true,
			'ENABLE_LABEL' => true,
			'RESET_TO_DEFAULT_MODE' => false,
		];
	}

	/**
	 * @param array<int, array{id: int, name: string}> $mailboxOptions
	 */
	private function getFilterFields(array $mailboxOptions): array
	{
		return [
			[
				'id' => 'MAILBOX_ID',
				'name' => Loc::getMessage('MAIL_LABEL_CONFIG_FILTER_MAILBOX'),
				'type' => 'list',
				'params' => ['multiple' => 'N'],
				'items' => $this->buildMailboxFilterItems($mailboxOptions),
				'default' => false,
			],
		];
	}

	/**
	 * @param array<int, array{id: int, name: string}> $mailboxOptions
	 * @return array<string, string>
	 */
	private function buildMailboxFilterItems(array $mailboxOptions): array
	{
		$items = ['0' => (string)Loc::getMessage('MAIL_LABEL_CONFIG_FILTER_MAILBOX_GLOBAL')];
		foreach ($mailboxOptions as $option)
		{
			$items[(string)(int)$option['id']] = (string)$option['name'];
		}

		return $items;
	}

	/**
	 * @param array<int, array{id: int, name: string}> $mailboxOptions
	 * @return array{search: string, mailboxId: int|null}
	 */
	private function getRequestFilter(array $mailboxOptions): array
	{
		$requestFilter = (new Options(self::FILTER_ID))->getFilter($this->getFilterFields($mailboxOptions));

		$search = '';
		if (isset($requestFilter['FIND']) && trim((string)$requestFilter['FIND']) !== '')
		{
			$search = trim((string)$requestFilter['FIND']);
		}

		$mailboxId = null;
		if (isset($requestFilter['MAILBOX_ID']) && $requestFilter['MAILBOX_ID'] !== '')
		{
			$mailboxId = (int)$requestFilter['MAILBOX_ID'];
		}

		return ['search' => $search, 'mailboxId' => $mailboxId];
	}

	/**
	 * @param array{search: string, mailboxId: int|null} $requestFilter
	 */
	private function filterLabels(array $labels, array $requestFilter): array
	{
		$search = $requestFilter['search'];
		$mailboxId = $requestFilter['mailboxId'];

		if ($search === '' && $mailboxId === null)
		{
			return $labels;
		}

		return array_values(array_filter(
			$labels,
			static function (array $label) use ($search, $mailboxId): bool {
				if ($search !== '' && mb_stripos((string)$label['name'], $search) === false)
				{
					return false;
				}

				return $mailboxId === null || (int)($label['mailboxId'] ?? 0) === $mailboxId;
			},
		));
	}

	/**
	 * @param array<int, array{id: int, name: string}> $options
	 * @return array<int, string>
	 */
	private function mailboxNamesFromOptions(array $options): array
	{
		$names = [];
		foreach ($options as $option)
		{
			$names[(int)$option['id']] = (string)$option['name'];
		}

		return $names;
	}

	/**
	 * @param array<int, string> $mailboxNames
	 */
	private function mailboxDisplayName(int $mailboxId, array $mailboxNames): string
	{
		if ($mailboxId <= 0)
		{
			return (string)Loc::getMessage('MAIL_LABEL_CONFIG_MAILBOX_ALL');
		}

		return (string)($mailboxNames[$mailboxId] ?? Loc::getMessage('MAIL_LABEL_CONFIG_MAILBOX_UNKNOWN'));
	}

	private function getMailboxDisplayName(array $mailbox): string
	{
		$name = trim((string)($mailbox['NAME'] ?? ''));
		if ($name !== '')
		{
			return $name;
		}

		return (string)($mailbox['EMAIL'] ?? '');
	}

	private function getFormUrl(): string
	{
		$labelsUrl = (string)($this->arParams['PATH_TO_MAIL_LABELS'] ?? '');
		if ($labelsUrl === '')
		{
			$labelsUrl = Context::getCurrent()->getRequest()->getRequestUri();
		}

		$uri = new Uri($labelsUrl);
		$uri->addParams(['form' => 'y']);

		return $uri->getUri();
	}

	private function prepareGrid(array $labels, array $mailboxNames, bool $hasActiveFilter = false): array
	{
		$rows = [];
		foreach ($labels as $label)
		{
			$labelId = (int)$label['id'];
			$name = (string)$label['name'];
			$unread = (int)($label['unread'] ?? 0);
			$mailboxLabel = $this->mailboxDisplayName((int)($label['mailboxId'] ?? 0), $mailboxNames);

			$rows[] = [
				'id' => $labelId,
				'columns' => [
					'NAME' => $this->renderNameColumn($name, $unread),
					'MAILBOX' => $this->renderMailboxColumn($mailboxLabel),
				],
				'actions' => [
					[
						'TEXT' => Loc::getMessage('MAIL_LABEL_CONFIG_RENAME'),
						'ONCLICK' => 'BX.Mail.Label.Config.List.openForm(' . $labelId . ')',
						'dataset' => ['testid' => 'mail-label-config-row-edit'],
						'attrs' => [
							'aria-label' => Loc::getMessage('MAIL_LABEL_CONFIG_RENAME_ARIA', ['#name#' => $name]),
						],
					],
					[
						'TEXT' => Loc::getMessage('MAIL_LABEL_CONFIG_DELETE'),
						'ONCLICK' => 'BX.Mail.Label.Config.List.confirmDelete(' . $labelId . ')',
						'dataset' => ['testid' => 'mail-label-config-row-delete'],
						'attrs' => [
							'aria-label' => Loc::getMessage('MAIL_LABEL_CONFIG_DELETE_ARIA', ['#name#' => $name]),
						],
					],
				],
			];
		}

		$grid = [
			'GRID_ID' => self::GRID_ID,
			'COLUMNS' => [
				[
					'id' => 'NAME',
					'name' => Loc::getMessage('MAIL_LABEL_CONFIG_COLUMN_NAME'),
					'default' => true,
				],
				[
					'id' => 'MAILBOX',
					'name' => Loc::getMessage('MAIL_LABEL_CONFIG_COLUMN_MAILBOX'),
					'default' => true,
				],
			],
			'ROWS' => $rows,
			'AJAX_MODE' => 'Y',
			'AJAX_OPTION_HISTORY' => 'N',
			'AJAX_OPTION_JUMP' => 'N',
			'AJAX_OPTION_STYLE' => 'N',
			'AJAX_ID' => \CAjax::GetComponentID('bitrix:main.ui.grid', '', ''),
			'ALLOW_ROWS_SORT' => false,
			'SHOW_ROW_CHECKBOXES' => false,
			'SHOW_CHECK_ALL_CHECKBOXES' => false,
			'SHOW_ACTION_PANEL' => false,
			'SHOW_PAGESIZE' => false,
			'SHOW_GRID_SETTINGS_MENU' => false,
		];

		if (empty($rows))
		{
			$grid['STUB'] = [
				'title' => Loc::getMessage($hasActiveFilter ? 'MAIL_LABEL_CONFIG_EMPTY_FILTERED' : 'MAIL_LABEL_CONFIG_EMPTY'),
			];
		}

		return $grid;
	}

	private function renderNameColumn(string $name, int $unread): string
	{
		$html = '<span class="mail-label-config__name">' . htmlspecialcharsbx($name) . '</span>';
		if ($unread > 0)
		{
			$html .= '<span class="mail-label-config__counter" aria-hidden="true">' . $unread . '</span>';
		}

		return '<span class="mail-label-config__name-cell">' . $html . '</span>';
	}

	private function renderMailboxColumn(string $mailboxLabel): string
	{
		return '<span class="mail-label-config__mailbox">' . htmlspecialcharsbx($mailboxLabel) . '</span>';
	}
}
