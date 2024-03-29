<?php

namespace Bitrix\Crm\UserField;

use Bitrix\Crm\Entity\FieldDataProvider;
use Bitrix\Crm\Service\Container;
use Bitrix\Main;
use Bitrix\Main\Type\DateTime;
use CCrmOwnerType;
use CUserTypeEntity;

class UserFieldHistory
{
	/** @var DateTime[] $items*/
	private static $items = null;
	public static function processCreation($entityTypeID, $fieldID)
	{
		self::synchronize($entityTypeID);
	}
	public static function processModification($entityTypeID, $fieldID)
	{
		$entityTypeID = (int)$entityTypeID;
		$fieldID = (int)$fieldID;
		if ($entityTypeID <= 0 && $fieldID > 0)
		{
			$userFieldInfo = CUserTypeEntity::GetList(array(), array('ID' => $fieldID))->Fetch();
			if($userFieldInfo)
			{
				$entityTypeID = CCrmOwnerType::ResolveIDByUFEntityID($userFieldInfo["ENTITY_ID"]);
			}
		}

		if (CCrmOwnerType::IsDefined($entityTypeID))
		{
			self::synchronize($entityTypeID);
		}
	}
	public static function processRemoval($entityTypeID, $fieldID)
	{
		self::synchronize($entityTypeID);
	}
	/**
	 * @return  DateTime|null
	 */
	public static function getLastChangeTime($entityTypeID)
	{
		self::load();
		return isset(self::$items[$entityTypeID]) ? self::$items[$entityTypeID] : null;
	}
	protected static function synchronize($entityTypeID)
	{
		self::load();
		self::$items[$entityTypeID] = new DateTime();
		self::save();

		$entityTypeID = (int)$entityTypeID;
		// clear cache on any uf settings change
		$factory = Container::getInstance()->getFactory($entityTypeID);
		if ($factory)
		{
			$factory->clearFieldsCollectionCache();
		}
		
		(new FieldDataProvider($entityTypeID))->invalidateFieldDataCache();
	}
	protected static function load()
	{
		if(self::$items !== null)
		{
			return;
		}

		self::$items = array();
		$s = Main\Config\Option::get('crm', 'crm_uf_history', '', '');
		$ary = $s !== '' ? unserialize($s, ['allowed_classes' => false]) : null;
		if(is_array($ary))
		{
			foreach($ary as $k => $v)
			{
				if($v === '')
				{
					continue;
				}

				$entityTypeID = CCrmOwnerType::ResolveID($k);
				if($entityTypeID !== CCrmOwnerType::Undefined)
				{
					self::$items[$entityTypeID] = new DateTime($v, \DateTime::ISO8601);
				}
			}
		}
	}
	protected static function save()
	{
		$ary = array();
		foreach(self::$items as $entityTypeID => $time)
		{
			$ary[CCrmOwnerType::ResolveName($entityTypeID)] = $time->format(\DateTime::ISO8601);
		}

		Main\Config\Option::set('crm', 'crm_uf_history', serialize($ary), '');
	}

	//region CUserTypeEntity events handlers
	public static function onAdd(array $fields)
	{
		self::processCreation(
			CCrmOwnerType::ResolveIDByUFEntityID($fields['ENTITY_ID']),
			$fields['ID']
		);
	}

	public static function onUpdate(array $fields, $ID)
	{
		self::processModification(
			CCrmOwnerType::ResolveIDByUFEntityID($fields['ENTITY_ID'] ?? null),
			$ID
		);
	}

	public static function onDelete(array $fields, $ID)
	{
		self::processRemoval(
			CCrmOwnerType::ResolveIDByUFEntityID($fields['ENTITY_ID']),
			$ID
		);
	}
	//endregion
}
