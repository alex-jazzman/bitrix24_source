<?php

namespace Bitrix\Mobile\AppTabs;

use Bitrix\Main\Loader;
use Bitrix\Main\LoaderException;
use Bitrix\Main\Localization\Loc;
use Bitrix\Mobile\Config\Feature;
use Bitrix\Mobile\Context;
use Bitrix\Mobile\Tab\Tabable;
use Bitrix\Mobile\Tab\Utils;
use Bitrix\MobileApp\Janative\Manager;
use Bitrix\StaffTrackMobile\Public\Features\CheckInFeature;

class CheckIn implements Tabable
{
	private Context $context;

	/**
	 * @throws LoaderException
	 * @throws \Exception
	 */
	public function getData(): ?array
	{
		if (!$this->isAvailable())
		{
			return null;
		}

		return $this->getDataInternal();
	}

	/**
	 * @throws \Exception
	 */
	public function getMenuData(): ?array
	{
		return [
			'id' => $this->getId(),
			'title' => $this->getTitle(),
			'imageName' => $this->getIconId(),
			'useLetterImage' => true,
			'section_code' => 'teamwork',
			'params' => [
				'id' => 'stafftrack_check_in',
//				'analytics' => Analytics::tasks(),
				'onclick' => Utils::getComponentJSCode($this->getDataInternal()['component']),
			],
			'tag' => 'new',
		];
	}

	/**
	 * @throws LoaderException
	 */
	public function isAvailable(): bool
	{
		return
			Loader::includeModule('intranet')
			&& Loader::includeModule('stafftrack')
			&& Loader::includeModule('stafftrackmobile')
			&& Feature::isEnabled(CheckInFeature::class)
		;
	}

	private function getDataInternal(): array
	{
		return [
			'id' => 'check-in',
			'badgeCode' => 'check-in',
			'sort' => 400,
			'imageName' => $this->getIconId(),
			'component' => $this->getTabsComponent(),
		];
	}

	private function getTabsComponent(): array
	{
		return [
			'name' => 'JSStackComponent',
			'title' => $this->getTitle(),
			'componentCode' => 'stafftrack.check-in-v2.tabs',
			'scriptPath' => Manager::getComponentPath('stafftrack:stafftrack.check-in-v2.tabs'),
			'rootWidget' => [
				'name' => 'tabs',
				'settings' => [
					'objectName' => 'tabs',
					'grabTitle' => false,
					'grabButtons' => true,
					'grabSearch' => true,
					'useLargeTitleMode' => true,
					'tabs' => [
						'items' => array_values(
							array_filter([
								$this->getShitsTab(),
								$this->getLocationsTab(),
							]),
						),
					],
				],
			],
			'params' => [
				'COMPONENT_CODE' => 'stafftrack.check-in-v2.tabs',
				'USER_ID' => $this->context->userId,
				'SITE_ID' => $this->context->siteId,
			],
		];
	}

	private function getShitsTab(): array
	{
		return [
			'id' => 'shifts',
			'title' => Loc::getMessage('TAB_STAFFTRACK_NAVIGATION_TAB_SHIFTS'),
			'disableScroll' => true,
			'widget' => [
				'name' => 'layout',
				'code' => 'shifts',
				'settings' => [
					'objectName' => 'layout',
				],
			],
		];
	}

	private function getLocationsTab(): array
	{
		return [
			'id' => 'locations',
			'title' => Loc::getMessage('TAB_STAFFTRACK_NAVIGATION_TAB_LOCATIONS'),
			'widget' => [
				'name' => 'layout',
				'code' => 'locations',
				'settings' => [
					'objectName' => 'layout',
				],
			],
		];
	}

	public function getId(): string
	{
		return 'check-in';
	}

	public function getTitle(): ?string
	{
		return Loc::getMessage('TAB_NAME_CHECK_IN');
	}

	public function getShortTitle(): ?string
	{
		return Loc::getMessage('TAB_NAME_CHECK_IN');
	}

	public function shouldShowInMenu(): bool
	{
		return $this->isAvailable();
	}

	public function canBeRemoved(): bool
	{
		return true;
	}

	public function canChangeSort(): bool
	{
		return true;
	}

	public function defaultSortValue(): int
	{
		return 400;
	}

	/**
	 * @param Context $context
	 * @return void
	 */
	public function setContext($context): void
	{
		$this->context = $context;
	}

	public function getIconId(): string
	{
		return 'location';
	}
}
