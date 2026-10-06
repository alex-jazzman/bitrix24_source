<?php
namespace Bitrix\Mobile\AppTabs;

use Bitrix\Call\Settings;
use Bitrix\Main\Loader;
use Bitrix\Main\Localization\Loc;
use Bitrix\Mobile\Tab\Tabable;
use Bitrix\MobileApp\Janative\Manager;

final class Sync implements Tabable
{
	private $context;

	public function isAvailable()
	{
		return (
			Loader::includeModule('callmobile')
			&& Loader::includeModule('call')
			&& Settings::isSyncPresetEnabled()
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
			'badgeCode' => 'sync',
			'component' => [
				'name' => 'JSStackComponent',
				'title' => $this->getTitle(),
				'componentCode' => 'call:sync',
				'scriptPath' => Manager::getComponentPath('call:sync'),
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
					'COMPONENT_CODE' => 'call:sync',
					'USER_ID' => $this->context->userId,
					'SITE_ID' => $this->context->siteId,
				],
			],
		];
	}

	public function getMenuData()
	{
		if (!$this->isAvailable())
		{
			return null;
		}

		$componentData = $this->getData()['component'];
		$componentData['params']['openSource'] = 'menu';

		return [
			'id' => $this->getId(),
			'section_code' => 'teamwork',
			'title' => $this->getTitle(),
			'useLetterImage' => true,
			'imageName' => $this->getIconId(),
			'sort' => $this->defaultSortValue(),
			'params' => [
				'onclick' => \Bitrix\Mobile\Tab\Utils::getComponentJSCode($componentData),
				'counter' => 'sync',
			],
		];
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
		return Loc::getMessage('TAB_NAME_SYNC');
	}

	public function setContext($context)
	{
		$this->context = $context;
	}

	public function getShortTitle()
	{
		return Loc::getMessage('TAB_NAME_SYNC');
	}

	public function getId()
	{
		return 'sync';
	}

	public function getIconId(): string
	{
		return 'record_video';
	}
}
