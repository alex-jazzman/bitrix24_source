<?php
namespace Bitrix\Mobile\AppTabs;
use Bitrix\Main\Application;
use Bitrix\Main\Loader;
use Bitrix\Main\Localization\Loc;
use Bitrix\Mobile\Tab\Tabable;
use Bitrix\MobileApp\Janative\Manager;
use Bitrix\Call\Settings;

final class CallList implements Tabable
{
	private $context;

	private const EAST_RELEASE_DATA = '07.11.2025 10:00';
	private const WESTERN_RELEASE_DATA = '27.11.2025 10:00';
	private const EXPIRE_DAYS_TS = 40 * 24 * 60 * 60;

	public function isAvailable()
	{
		return (
			Loader::includeModule('callmobile')
			&& Loader::includeModule('call')
		);
	}

	public function getData()
	{
		if (!$this->isAvailable())
		{
			return null;
		}

		return [
			'id' => $this->getId(),
			'sort' => $this->defaultSortValue(),
			'imageName' => $this->getIconId(),
			'badgeCode' => 'call_list',
			'component' => [
				'name' => 'JSStackComponent',
				'title' => $this->getTitle(),
				'componentCode' => 'call:callList',
				'scriptPath' => Manager::getComponentPath('call:callList'),
				'rootWidget' => [
					'name' => 'layout',
					'settings' => [
						'objectName' => 'layout',
						'useLargeTitleMode' => true,
						'titleParams' => [
							'useLargeTitleMode' => true,
							'text' => $this->getTitle(),
						],
					],
				],
				'params' => [
					'COMPONENT_CODE' => 'call:callList',
					'USER_ID' => $this->context->userId,
					'SITE_ID' => $this->context->siteId,
					'IS_CREATE_CALL_BUTTON_ENABLED' => Settings::isCreateCallButtonEnabled(),
				],
			],
		];
	}

	public function getMenuData()
	{
		$menuData = [
			'id' => $this->getId(),
			'section_code' => 'teamwork',
			'title' => $this->getTitle(),
			'useLetterImage' => true,
			'imageName' => $this->getIconId(),
			'sort' => $this->defaultSortValue(),
			'params' => [
				'onclick' => \Bitrix\Mobile\Tab\Utils::getComponentJSCode($this->getData()['component']),
				'counter' => 'call_list',
			],
		];

		if (!$this->isTagNewExpired())
		{
			$menuData['tag'] = 'new';
		}

		return $menuData;
	}

	private function isTagNewExpired(): bool
	{
		$eastReleaseDate = \DateTime::createFromFormat(
			'd.m.Y H:i',
			self::EAST_RELEASE_DATA,
			new \DateTimeZone('Europe/Moscow')
		);

		$westernReleaseDate = \DateTime::createFromFormat(
			'd.m.Y H:i',
			self::WESTERN_RELEASE_DATA,
			new \DateTimeZone('Europe/Moscow')
		);

		$zoneId = $this->getZoneId();

		$releaseTs = in_array($zoneId, ['ru', 'kz', 'by'], true)
			? $eastReleaseDate->getTimestamp()
			: $westernReleaseDate->getTimestamp();

		$expireTs = $releaseTs + self::EXPIRE_DAYS_TS;

		return time() > $expireTs;
	}

	private function getZoneId()
	{
		return Application::getInstance()->getLicense()->getRegion() ?? 'en';
	}

	public function shouldShowInMenu()
	{
		return $this->isAvailable();
	}

	public function canBeRemoved()
	{
		return true;
	}

	public function defaultSortValue()
	{
		return 100;
	}

	public function canChangeSort()
	{
		return true;
	}

	public function getTitle()
	{
		return Loc::getMessage('TAB_NAME_CALL_LIST');
	}

	public function setContext($context)
	{
		$this->context = $context;
	}

	public function getShortTitle()
	{
		return Loc::getMessage('TAB_NAME_CALL_LIST');
	}

	public function getId()
	{
		return 'call_list';
	}

	public function getIconId(): string
	{
		return 'phone_up';
	}
}
