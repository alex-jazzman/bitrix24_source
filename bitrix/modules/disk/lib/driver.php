<?php

namespace Bitrix\Disk;

use Bitrix\Disk\Bitrix24Disk\SubscriberManager;
use Bitrix\Disk\Document\DocumentHandlersManager;
use Bitrix\Disk\Internals\DeletedLogManager;
use Bitrix\Disk\Internals\DeletionNotifyManager;
use Bitrix\Disk\Internals\Error\Error;
use Bitrix\Disk\Internals\Error\ErrorCollection;
use Bitrix\Disk\Internals\Error\IErrorable;
use Bitrix\Disk\Search\IndexManager;
use Bitrix\Disk\Security\FakeSecurityContext;
use Bitrix\Disk\Uf\UserFieldManager;
use Bitrix\Main\ArgumentException;
use Bitrix\Main\Data\Cache;
use Bitrix\Main\DI\ServiceLocator;
use Bitrix\Main\Loader;
use Bitrix\Main\ModuleManager;
use Bitrix\Main\SystemException;
use Bitrix\Main\Text\Emoji;
use Bitrix\Pull\Model\Channel;

final class Driver implements IErrorable
{
	const INTERNAL_MODULE_ID = 'disk';

	/** @var  ErrorCollection */
	protected $errorCollection;
	/** @var  Driver */
	private static $instance;

	private function __construct()
	{
		$this->errorCollection = new ErrorCollection;
	}

	private function __clone()
	{
	}

	/**
	 * Returns Singleton of Driver
	 * @return Driver
	 */
	public static function getInstance()
	{
		if (!isset(self::$instance))
		{
			self::$instance = new Driver;
		}

		return self::$instance;
	}

	/**
	 * Returns status of migrate from old webdav
	 * @return bool
	 * @throws \Bitrix\Main\ArgumentNullException
	 */
	public static function isSuccessfullyConverted()
	{
		return Configuration::isSuccessfullyConverted();
	}

	/**
	 * Creates storage in module Disk.
	 * This is core method. If you need to create user storage use Driver::addUserStorage,
	 * if group storage use Driver::addGroupStorage, if common storage use Driver::addCommonStorage.
	 *
	 * @param array $data Array with fields. Necessary: NAME, MODULE_ID, ENTITY_ID, ENTITY_TYPE.
	 * @param array $rights Array of rights.
	 * @throws \Bitrix\Main\SystemException
	 * @throws \Bitrix\Main\ArgumentException
	 * @return null|Storage
	 */
	public function addStorage(array $data, array $rights = array())
	{
		$this->errorCollection->clear();
		$this->checkRequiredInputParams($data, array(
			'NAME',
			'MODULE_ID',
			'ENTITY_TYPE',
			'ENTITY_ID',
		));

		if(isset($data['USE_INTERNAL_RIGHTS']) && !$data['USE_INTERNAL_RIGHTS'] && !empty($rights))
		{
			throw new ArgumentException('Attempt to set the rights, but not to use the internal rights.');
		}
		/** @var Storage $storageModel */
		$storageModel = Storage::add($data, $this->errorCollection);
		if(!$storageModel)
		{
			return null;
		}

		if($storageModel->isUseInternalRights())
		{
			Driver::getInstance()->getRightsManager()->setAsNewLeaf($storageModel->getRootObject(), $rights);
		}

		return $storageModel;
	}

	/**
	 * Creates storage if it doesn't exist.
	 * See method Driver::addStorage.
	 *
	 * @param array $data Data to add storage.
	 * @param array $rights Rights on storage.
	 * @throws \Bitrix\Main\ArgumentException
	 * @return null|Storage
	 */
	public function addStorageIfNotExist(array $data, array $rights = array())
	{
		$filter = array_intersect_key($data, array(
			'ID' => true,
			'MODULE_ID' => true,
			'ENTITY_TYPE' => true,
			'ENTITY_ID' => true
		));

		if(empty($filter))
		{
			throw new ArgumentException('Empty fields for filtering.');
		}

		$storage = Storage::getList(array(
			'select' => array('ID'),
			'filter' => $filter,
		))->fetch();

		if($storage)
		{
			return Storage::loadById($storage['ID']);
		}

		return self::addStorage($data, $rights);
	}

	/**
	 * Creates storage for user and sets default rights.
	 * If storage already exists returns its.
	 *
	 * @param User $user Object representation of user.
	 * @return Storage|null
	 * @throws ArgumentException
	 * @throws SystemException
	 * @throws \Bitrix\Main\LoaderException
	 */
	public function addUserStorageByObject(User $user): ?Storage
	{
		if (!Loader::includeModule('socialnetwork'))
		{
			throw new SystemException('Could not create user storage without module "socialnetwork"');
		}

		$userId = $user->getId();

		$userName = $user->getFormattedName();
		$data = $this->getUserStorageParams($userId, $userName);

		$rights = $this->getUserStorageRights($userId, $user->isIntranetUser());

		return $this->addStorageIfNotExist($data, $rights);
	}

	/**
	 * Creates storage for user and sets default rights.
	 * If storage already exists returns its.
	 *
	 * @param integer $userId Id of user.
	 * @return Storage|null
	 * @throws ArgumentException
	 * @throws SystemException
	 * @throws \Bitrix\Main\LoaderException
	 */
	public function addUserStorage($userId)
	{
		if (!Loader::includeModule('socialnetwork'))
		{
			throw new SystemException('Could not create user storage without module "socialnetwork"');
		}

		$userId = (int)$userId;

		/** @var User $userModel */
		$userModel = User::loadById($userId);

		if ($userModel === null) {
			$userModel = User::buildFromArray(['ID' => $userId]);
		}

		return $this->addUserStorageByObject($userModel);
	}

	private function getUserStorageParams(int $userId, string $userName): array
	{
		return [
			'NAME' => $userName ?: "user {$userId}",
			'USE_INTERNAL_RIGHTS' => 1,
			'MODULE_ID' => self::INTERNAL_MODULE_ID,
			'ENTITY_TYPE' => ProxyType\User::className(),
			'ENTITY_ID' => $userId,
		];
	}

	private function getUserStorageRights(int $userId, bool $isIntranetUser): array
	{
		$rightsManager = $this->getRightsManager();
		$fullAccessTaskId = $rightsManager->getTaskIdByName($rightsManager::TASK_FULL);

		$rights = [
			[
				'ACCESS_CODE' => 'U' . $userId,
				'TASK_ID' => $fullAccessTaskId,
			],
		];

		if ($isIntranetUser)
		{
			$rights[] = [
				'ACCESS_CODE' => 'IU' . $userId,
				'TASK_ID' => $fullAccessTaskId,
			];
		}

		return $rights;
	}

	/**
	 * Creates storage for group and sets default rights.
	 * If storage already exists returns its.
	 *
	 * @param integer $groupId Id of group.
	 * @return Storage|null
	 * @throws ArgumentException
	 * @throws SystemException
	 * @throws \Bitrix\Main\LoaderException
	 */
	public function addGroupStorage($groupId)
	{
		if(!Loader::includeModule('socialnetwork'))
		{
			throw new SystemException('Could not create group storage without module "socialnetwork"');
		}

		$groupId = (int)$groupId;
		$data = array(
			'NAME' => "group {$groupId}",
		);
		$group = \CSocNetGroup::getList(array(), array('ID' => $groupId), false, false, array('NAME'));
		if($group)
		{
			$group = $group->fetch();
			$data['NAME'] = mb_substr(Emoji::decode($group['NAME']), 0, 100);
		}

		$data['USE_INTERNAL_RIGHTS'] = 1;
		$data['MODULE_ID'] = self::INTERNAL_MODULE_ID;
		$data['ENTITY_TYPE'] = ProxyType\Group::className();
		$data['ENTITY_ID'] = $groupId;

		$rightsManager = $this->getRightsManager();
		$fullAccessTaskId = $rightsManager->getTaskIdByName($rightsManager::TASK_FULL);
		$editAccessTaskId = $rightsManager->getTaskIdByName($rightsManager::TASK_EDIT);

		return self::addStorageIfNotExist($data, array(
			array(
				'ACCESS_CODE' => 'SG' . $groupId . '_A',
				'TASK_ID' => $fullAccessTaskId,
			),
			array(
				'ACCESS_CODE' => 'SG' . $groupId . '_E',
				'TASK_ID' => $editAccessTaskId,
			),
			array(
				'ACCESS_CODE' => 'SG' . $groupId . '_K',
				'TASK_ID' => $editAccessTaskId,
			),
		));
	}

	/**
	 * Creates common storage.
	 * If storage already exists returns its.
	 *
	 * @param array $data Array with fields. Necessary: NAME, ENTITY_ID.
	 * @param array $rights Array with rights.
	 * @return Storage|null
	 * @throws ArgumentException
	 */
	public function addCommonStorage(array $data, array $rights)
	{
		$this->checkRequiredInputParams($data, array(
			'NAME',
			'ENTITY_ID',
			'SITE_ID',
		));

		$data['USE_INTERNAL_RIGHTS'] = 1;
		$data['MODULE_ID'] = self::INTERNAL_MODULE_ID;
		$data['ENTITY_TYPE'] = ProxyType\Common::className();

		return self::addStorageIfNotExist($data, $rights);
	}

	/**
	 * Creates storage for REST application.
	 * If storage already exists returns its.
	 *
	 * @param array $data Data to add storage.
	 * @return Storage|null
	 * @throws ArgumentException
	 */
	public function addRestAppStorage(array $data)
	{
		$this->checkRequiredInputParams($data, array(
			'NAME',
			'ENTITY_ID',
		));

		$data['USE_INTERNAL_RIGHTS'] = 1;
		$data['MODULE_ID'] = self::INTERNAL_MODULE_ID;
		$data['ENTITY_TYPE'] = ProxyType\RestApp::className();

		$rightsManager = $this->getRightsManager();
		$fullAccessTaskId = $rightsManager->getTaskIdByName($rightsManager::TASK_FULL);

		return self::addStorageIfNotExist($data, array(
			array(
				'ACCESS_CODE' => 'AU',
				'TASK_ID' => $fullAccessTaskId,
			),
		));
	}

	/**
	 * Returns storage by user id.
	 * If storage doesn't exist returns null.
	 *
	 * @param int $userId Id of user.
	 * @return null|Storage
	 * @throws \Bitrix\Main\ArgumentException
	 * @throws \Bitrix\Main\SystemException
	 */
	public function getStorageByUserId(int $userId): ?Storage
	{
		return $this->getStorageByEntityType([
			'MODULE_ID' => self::INTERNAL_MODULE_ID,
			'ENTITY_TYPE' => ProxyType\User::class,
			'ENTITY_ID' => $userId,
		]);
	}

	/**
	 * Returns storage by group id.
	 * If storage doesn't exist returns null.
	 *
	 * @param int $groupId Id of group.
	 * @return null|Storage
	 */
	public function getStorageByGroupId(int $groupId): ?Storage
	{
		return $this->getStorageByEntityType([
			'MODULE_ID' => self::INTERNAL_MODULE_ID,
			'ENTITY_TYPE' => ProxyType\Group::class,
			'ENTITY_ID' => $groupId,
		]);
	}

	/**
	 * Returns common storage by id.
	 *
	 * If you want to find Common storage (default Company docs), you must use $commonId = shared_files_s1.
	 * Else "shared_files_{$siteID}"
	 *
	 * @param string $commonId Id of storage.
	 * @return null|Storage
	 */
	public function getStorageByCommonId(string $commonId): ?Storage
	{
		return $this->getStorageByEntityType([
			'MODULE_ID' => self::INTERNAL_MODULE_ID,
			'ENTITY_TYPE' => ProxyType\Common::class,
			'ENTITY_ID' => $commonId,
		]);
	}

	/**
	 * Returns storage by app id (using in REST).
	 *
	 * @param string $appId Id of application in REST.
	 * @return null|Storage
	 */
	public function getStorageByRestApp(string $appId): ?Storage
	{
		return $this->getStorageByEntityType([
			'MODULE_ID' => self::INTERNAL_MODULE_ID,
			'ENTITY_TYPE' => ProxyType\RestApp::class,
			'ENTITY_ID' => $appId,
		]);
	}

	private function getStorageByEntityType(array $entityType): ?Storage
	{
		$runtimeCache = ServiceLocator::getInstance()->get('disk.storageRuntimeCache');
		if ($runtimeCache->isLoadedByEntityType($entityType))
		{
			return $runtimeCache->getByEntityType($entityType);
		}

		return Storage::load($entityType, ['ROOT_OBJECT']);
	}

	/**
	 * Returns fake security context, which returns always true on rights check.
	 *
	 * @return FakeSecurityContext
	 */
	public function getFakeSecurityContext()
	{
		return new FakeSecurityContext(null);
	}

	/**
	 * Returns rights manager, which uses in storages with internal rights
	 *
	 * @return RightsManager
	 */
	public function getRightsManager()
	{
		return ServiceLocator::getInstance()->get('disk.rightsManager');
	}

	/**
	 * Returns url manager.
	 *
	 * @return UrlManager
	 */
	public function getUrlManager()
	{
		return ServiceLocator::getInstance()->get('disk.urlManager');
	}

	/**
	 * Returns user field manager.
	 * Provides help with $USER_FIELD_MANAGER
	 *
	 *
	 * @return UserFieldManager
	 */
	public function getUserFieldManager()
	{
		return ServiceLocator::getInstance()->get('disk.ufManager');
	}

	/**
	 * Returns index manager.
	 * Provides help with index documents.
	 *
	 * @return IndexManager
	 */
	public function getIndexManager()
	{
		return ServiceLocator::getInstance()->get('disk.indexManager');
	}

	/**
	 * Returns recently used objects manager.
	 *
	 * @return RecentlyUsedManager
	 */
	public function getRecentlyUsedManager()
	{
		return ServiceLocator::getInstance()->get('disk.recentlyUsedManager');
	}

	/**
	 * Returns document handlers manager.
	 *
	 * @return DocumentHandlersManager
	 */
	public function getDocumentHandlersManager()
	{
		return ServiceLocator::getInstance()->get('disk.documentHandlersManager');
	}

	/**
	 * Returns subscribe manager.
	 *
	 * @return SubscriberManager
	 */
	public function getSubscriberManager()
	{
		return ServiceLocator::getInstance()->get('disk.subscriberManager');
	}

	/**
	 * Returns deleted log manager.
	 *
	 * @return DeletedLogManager
	 */
	public function getDeletedLogManager()
	{
		return ServiceLocator::getInstance()->get('disk.deletedLogManager');
	}

	public function getDeletionNotifyManager(): DeletionNotifyManager
	{
		return ServiceLocator::getInstance()->get('disk.deletionNotifyManager');
	}

	/**
	 * Returns REST manager.
	 *
	 * @return Rest\RestManager
	 */
	public function getRestManager()
	{
		return ServiceLocator::getInstance()->get('disk.restManager');
	}

	/**
	 * @return TrackedObjectManager
	 */
	public function getTrackedObjectManager()
	{
		return ServiceLocator::getInstance()->get('disk.trackedObjectManager');
	}
	/**
	 * Getting array of errors.
	 * @return Error[]
	 */
	public function getErrors()
	{
		return $this->errorCollection->toArray();
	}

	/**
	 * Getting array of errors with the necessary code.
	 * @param string $code Code of error.
	 * @return Error[]
	 */
	public function getErrorsByCode($code)
	{
		return $this->errorCollection->getErrorsByCode($code);
	}

	/**
	 * Getting once error with the necessary code.
	 * @param string $code Code of error.
	 * @return Error
	 */
	public function getErrorByCode($code)
	{
		return $this->errorCollection->getErrorByCode($code);
	}

	/**
	 * Send notify by module "IM".
	 *
	 * @param int $toUserId Target user id.
	 * @param array $dataNotify Specific data.
	 * @return bool
	 * @throws \Bitrix\Main\LoaderException
	 */
	public function sendNotify($toUserId, array $dataNotify)
	{
		if(! (ModuleManager::isModuleInstalled('im') && Loader::includeModule('im')) )
		{
			return false;
		}
		$dataNotify['NOTIFY_MODULE'] = self::INTERNAL_MODULE_ID;
		$dataNotify['TO_USER_ID'] = $toUserId;
		switch($dataNotify['NOTIFY_TYPE'])
		{
			case 'IM_NOTIFY_FROM':
				$dataNotify['NOTIFY_TYPE'] = IM_NOTIFY_FROM;
				break;
			case 'IM_NOTIFY_CONFIRM':
				$dataNotify['NOTIFY_TYPE'] = IM_NOTIFY_CONFIRM;
				break;
			default:
				$dataNotify['NOTIFY_TYPE'] = IM_NOTIFY_FROM;
		}
		;

		return (bool) \CIMNotify::add($dataNotify);
	}

	/**
	 * Send change status to Bitrix24.Disk by subscribers of object.
	 *
	 * @param BaseObject $object Target object.
	 * @param string $way
	 *
	 * @return void
	 */
	public function sendChangeStatusToSubscribers(BaseObject $object, $way = 'old')
	{
		if(defined('DISK_MIGRATE_MODE'))
		{
			return;
		}

		$subscribers = $way === 'old'?
			$this->collectSubscribers($object) :
			$this->getSubscriberManager()->collectSubscribersSmart($object)
		;

		if($object instanceof Folder)
		{
			Driver::getInstance()->cleanCacheTreeBitrixDisk(array_keys($subscribers));
		}
		$this->sendChangeStatus($subscribers);
	}

	/**
	 * Collect all subscribers by object (@see Sharing)
	 * Return associative array: storageId => userId.
	 *
	 * @param \Bitrix\Disk\BaseObject|BaseObject $object Target object.
	 * @return array
	 */
	public function collectSubscribers(BaseObject $object)
	{
		return $this->getSubscriberManager()->collectSubscribers($object);
	}

	/**
	 * Cleans cache with folders tree.
	 *
	 * @internal
	 * @deprecated
	 * @param array $storageIds List of storage id.
	 * @return void
	 */
	public function cleanCacheTreeBitrixDisk(array $storageIds)
	{
		$cache = Cache::createInstance();
		foreach ($storageIds as $id)
		{
			$cache->clean("new_storage_tr_{$id}", 'disk');
		}

		foreach ($storageIds as $id)
		{
			$cache->clean("storage_tr_{$id}", 'disk');
		}
	}

	/**
	 * Send event to Bitrix24.Disk to getting snapshot.
	 *
	 * @param int|array $userIds List of user ids.
	 * @param string $debug Debug data.
	 * @return void
	 */
	public function sendChangeStatus($userIds, $debug = '')
	{
		if(defined('DISK_MIGRATE_MODE'))
		{
			return;
		}
		$this->sendEvent($userIds, 'notify', array(
			'change' => true,
			'debug' => $debug,
		));
	}

	/**
	 * Send event by module pull.
	 *
	 * @param array|string|int|Channel $userIds List of user ids.
	 * @param string $command Command determine action on client.
	 * @param array     $data Optional data which can be used on client.
	 * @throws \Bitrix\Main\LoaderException
	 * @return void
	 */
	public function sendEvent($userIds, $command, array $data = array())
	{
		if (empty($userIds))
		{
			return;
		}

		if (!Loader::includeModule('pull'))
		{
			return;
		}

		$message = array(
			'module_id' => self::INTERNAL_MODULE_ID,
			'command' => $command,
			'params' => $data,
		);

		if (!is_array($userIds))
		{
			$userIds = array($userIds);
		}

		$userIds = array_filter(array_unique($userIds));

		\Bitrix\Pull\Event::add($userIds, $message);
	}

	private function checkRequiredInputParams(array $inputParams, array $required)
	{
		foreach ($required as $item)
		{
			if(!isset($inputParams[$item]) || (!$inputParams[$item] && !(is_string($inputParams[$item]) && mb_strlen($inputParams[$item]))))
			{
				throw new ArgumentException("Required params: { {$item} }");
			}
		}
	}
}
