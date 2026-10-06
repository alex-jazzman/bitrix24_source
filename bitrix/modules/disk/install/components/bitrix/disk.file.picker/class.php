<?php

use Bitrix\Disk\FilePicker\Filter;
use Bitrix\Main\Engine\ActionFilter\Authentication;
use Bitrix\Main\Engine\ActionFilter\HttpMethod;
use Bitrix\Main\Engine\Contract\Controllerable;
use Bitrix\Main\Engine\Response\Render;
use Bitrix\Main\Loader;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\SystemException;
use Bitrix\Main\UI\Filter\Theme;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

Loc::loadMessages(__FILE__);
Loader::requireModule('disk');

class CDiskFilePickerComponent extends CBitrixComponent implements Controllerable
{
	public const FILTER_ID = 'DISK_FILE_PICKER_FILTER';

	private const OBJECT_TYPE_FIELD_ID = 'OBJECT_TYPE_FILTER';
	private const FILE_TYPE_FIELD_ID = 'FILE_TYPE_FILTERS';

	// Stable preset ids: one file type per preset. Kept independent of the filter
	// aliases so a renamed alias never silently changes a saved preset.
	private const FILE_TYPE_PRESETS = [
		'disk_file_picker_documents' => Filter::TYPE_DOCUMENT,
		'disk_file_picker_spreadsheets' => Filter::TYPE_SPREADSHEET,
		'disk_file_picker_presentations' => Filter::TYPE_PRESENTATION,
		'disk_file_picker_boards' => Filter::TYPE_BOARD,
		'disk_file_picker_images' => Filter::TYPE_IMAGE,
		'disk_file_picker_audio' => Filter::TYPE_AUDIO,
		'disk_file_picker_video' => Filter::TYPE_VIDEO,
		'disk_file_picker_other' => Filter::TYPE_OTHER,
	];

	private const PRESET_TITLE_BY_ID = [
		'disk_file_picker_documents' => 'DISK_FILE_PICKER_PRESET_DOCUMENT',
		'disk_file_picker_spreadsheets' => 'DISK_FILE_PICKER_PRESET_SPREADSHEET',
		'disk_file_picker_presentations' => 'DISK_FILE_PICKER_PRESET_PRESENTATION',
		'disk_file_picker_boards' => 'DISK_FILE_PICKER_PRESET_BOARD',
		'disk_file_picker_images' => 'DISK_FILE_PICKER_PRESET_IMAGE',
		'disk_file_picker_audio' => 'DISK_FILE_PICKER_PRESET_AUDIO',
		'disk_file_picker_video' => 'DISK_FILE_PICKER_PRESET_VIDEO',
		'disk_file_picker_other' => 'DISK_FILE_PICKER_PRESET_OTHER',
	];

	public function configureActions(): array
	{
		return [
			'getBootstrap' => [
				'prefilters' => [
					new Authentication(),
					new HttpMethod([HttpMethod::METHOD_POST]),
				],
			],
		];
	}

	public function getBootstrapAction(): array
	{
		$html = $this->renderBootstrap();
		$this->validateBootstrap($html);

		return [
			'html' => $html,
			'filterId' => self::FILTER_ID,
		];
	}

	protected function renderBootstrap(): string
	{
		$response = new Render\Component(
			'bitrix:main.ui.filter',
			'',
			$this->getFilterParameters(),
			withSiteTemplate: false,
		);

		return $response->getContent();
	}

	protected function getFilterParameters(): array
	{
		return [
			'FILTER_ID' => self::FILTER_ID,
			'THEME' => Theme::AIR,
			'DISABLE_SEARCH' => false,
			'ENABLE_LABEL' => true,
			'FILTER_PRESETS' => $this->getFilterPresets(),
			'FILTER' => [
				[
					'id' => self::OBJECT_TYPE_FIELD_ID,
					'name' => Loc::getMessage('DISK_FILE_PICKER_FILTER_OBJECT_TYPE'),
					'type' => 'list',
					'params' => [
						'multiple' => false,
					],
					'items' => [
						Filter::OBJECT_TYPE_ALL => Loc::getMessage('DISK_FILE_PICKER_FILTER_OBJECT_TYPE_ALL'),
						Filter::OBJECT_TYPE_FILES => Loc::getMessage('DISK_FILE_PICKER_FILTER_OBJECT_TYPE_FILES'),
						Filter::OBJECT_TYPE_FOLDERS => Loc::getMessage('DISK_FILE_PICKER_FILTER_OBJECT_TYPE_FOLDERS'),
					],
				],
				[
					'id' => self::FILE_TYPE_FIELD_ID,
					'name' => Loc::getMessage('DISK_FILE_PICKER_FILTER_FILE_TYPE'),
					'type' => 'list',
					'default' => true,
					'params' => [
						'multiple' => true,
					],
					'items' => [
						Filter::TYPE_DOCUMENT => Loc::getMessage('DISK_FILE_PICKER_FILTER_DOCUMENT'),
						Filter::TYPE_SPREADSHEET => Loc::getMessage('DISK_FILE_PICKER_FILTER_SPREADSHEET'),
						Filter::TYPE_PRESENTATION => Loc::getMessage('DISK_FILE_PICKER_FILTER_PRESENTATION'),
						Filter::TYPE_BOARD => Loc::getMessage('DISK_FILE_PICKER_FILTER_BOARD'),
						Filter::TYPE_IMAGE => Loc::getMessage('DISK_FILE_PICKER_FILTER_IMAGE'),
						Filter::TYPE_AUDIO => Loc::getMessage('DISK_FILE_PICKER_FILTER_AUDIO'),
						Filter::TYPE_VIDEO => Loc::getMessage('DISK_FILE_PICKER_FILTER_VIDEO'),
						Filter::TYPE_OTHER => Loc::getMessage('DISK_FILE_PICKER_FILTER_OTHER'),
					],
				],
			],
		];
	}

	// One preset per file type: each pins the FILE_TYPE_FILTERS multiselect to a
	// single alias. Selecting a preset flows through the standard BX.Main.Filter:apply,
	// which the frontend adapter already normalizes into `fileTypeFilters`.
	protected function getFilterPresets(): array
	{
		$presets = [];
		foreach (self::FILE_TYPE_PRESETS as $presetId => $alias)
		{
			$presets[$presetId] = [
				'name' => Loc::getMessage(self::PRESET_TITLE_BY_ID[$presetId]),
				'default' => false,
				'fields' => [
					self::FILE_TYPE_FIELD_ID => [$alias],
				],
			];
		}

		return $presets;
	}

	private function validateBootstrap(string $html): void
	{
		$hasExternalAsset = preg_match('/<(?:script\b[^>]*\bsrc|link\b[^>]*\bhref)\s*=/i', $html) === 1;
		if (
			$html === ''
			|| !str_contains($html, self::FILTER_ID)
			|| !$hasExternalAsset
			|| !str_contains($html, '<script')
			|| !str_contains($html, 'BX.Main.Filter')
		)
		{
			throw new SystemException('Could not render the file picker filter.');
		}
	}
}
