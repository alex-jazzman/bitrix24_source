<?php
use Bitrix\Disk\Driver;
use Bitrix\Disk\Folder;
use Bitrix\Disk\Internal\Service\UnifiedLink\UnifiedLinkAccessService;
use Bitrix\Disk\Internal\Service\UnifiedLink\UnifiedLinkUrl;
use Bitrix\Disk\Internals\Error\Error;
use Bitrix\Disk\Internals\ObjectTable;
use Bitrix\Disk\Security\SecurityContext;
use Bitrix\Disk\Storage;
use Bitrix\Main\DI\ServiceLocator;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\Text\Encoding;

define('STOP_STATISTICS', true);
define('BX_SECURITY_SHOW_MESSAGE', true);
define("NOT_CHECK_PERMISSIONS", true);

$siteId = isset($_REQUEST['SITE_ID']) && is_string($_REQUEST['SITE_ID'])? $_REQUEST['SITE_ID'] : '';
$siteId = mb_substr(preg_replace('/[^a-z0-9_]/i', '', $siteId), 0, 2);
if(!empty($siteId) && is_string($siteId))
{
	define('SITE_ID', $siteId);
}

require_once($_SERVER['DOCUMENT_ROOT'].'/bitrix/modules/main/include/prolog_before.php');

if (!CModule::IncludeModule('disk') || !\Bitrix\Main\Application::getInstance()->getContext()->getRequest()->getQuery('action'))
{
	return;
}

Loc::loadMessages(__FILE__);

class DiskBreadcrumbsAjaxController extends \Bitrix\Disk\Internals\Controller
{
	const ERROR_COULD_NOT_FIND_FOLDER = 'DISK_BAC_22001';

	protected function listActions()
	{
		return array(
			'showSubFolders' => array(
				'method' => array('POST'),
			),
			'reloadBreadcrumbs' => array(
				'method' => array('POST'),
			),
		);
	}

	protected function processActionShowSubFolders()
	{
		if(!$this->checkRequiredPostParams(array('objectId')))
		{
			$this->sendJsonErrorResponse();
		}
		$showOnlyDeleted = (bool)$this->request->getPost('showOnlyDeleted');
		$isRoot = (bool)$this->request->getPost('isRoot');

		/** @var Folder $folder */
		$folder = Folder::loadById((int)$this->request->getPost('objectId'), array('STORAGE'));
		if(!$folder)
		{
			$this->errorCollection->add(array(new Error(Loc::getMessage('DISK_BREADCRUMBS_ERROR_COULD_NOT_FIND_FOLDER'), self::ERROR_COULD_NOT_FIND_FOLDER)));
			$this->sendJsonErrorResponse();
		}
		$shouldCheckUnifiedLink = $this->shouldCheckUnifiedLink($folder);
		$securityContext = $folder->getStorage()->getCurrentUserSecurityContext($shouldCheckUnifiedLink);

		$subFolders = array();
		$filter = array(
			'TYPE' => ObjectTable::TYPE_FOLDER,
		);
		if($showOnlyDeleted)
		{
			$filter['!=DELETED_TYPE'] = ObjectTable::DELETED_TYPE_NONE;
		}

		$children = $this->getSubFolderModels(
			$folder,
			$securityContext,
			$filter,
			$showOnlyDeleted,
			$isRoot,
			$shouldCheckUnifiedLink
		);

		foreach($children as $subFolder)
		{
			/** @var Folder $subFolder */
			$subFolders[] = array(
				'id' => $subFolder->getId(),
				'name' => $subFolder->getName(),
				'uriComponent' => $subFolder->getOriginalName(),
				'isLink' => $subFolder->isLink(),
			);
		}
		unset($subFolder);
		\Bitrix\Main\Type\Collection::sortByColumn($subFolders, 'name');


		$this->sendJsonSuccessResponse(array(
			'items' => $subFolders,
		));
	}

	protected function shouldCheckUnifiedLink(Folder $folder): bool
	{
		$uls = (new UnifiedLinkUrl())->getUlsFromRequest($this->request);
		if (!is_string($uls))
		{
			return false;
		}

		return ServiceLocator::getInstance()
			->get(UnifiedLinkAccessService::class)
			->validateUlsForObjectId($folder->getId(), $uls)
		;
	}

	protected function getSubFolderModels(
		Folder $folder,
		SecurityContext $securityContext,
		array $filter,
		bool $showOnlyDeleted,
		bool $isRoot,
		bool $shouldCheckUnifiedLink
	): array
	{
		if($showOnlyDeleted && $isRoot)
		{
			$filter['DELETED_TYPE'] = ObjectTable::DELETED_TYPE_ROOT;
			$parameters = [
				'filter' => $filter,
			];

			// The storage filter narrows candidates before the subtree check.
			if ((int)$folder->getStorage()->getRootObjectId() === (int)$folder->getId())
			{
				$parameters['subtree_check'] = ObjectTable::SUBTREE_CHECK_EXISTS;
			}

			return $folder->getDescendants($securityContext, $parameters);
		}

		if (!$shouldCheckUnifiedLink)
		{
			return $folder->getChildren($securityContext, array('filter' => $filter));
		}

		$children = $folder->getChildren(
			Driver::getInstance()->getFakeSecurityContext(),
			array('filter' => $filter)
		);

		$securityContext->preloadUnifiedLinkAccessLevelsForObjects($children);

		return array_filter(
			$children,
			static fn($subFolder) => $subFolder instanceof Folder && $subFolder->canRead($securityContext),
		);
	}

	protected function processActionReloadBreadcrumbs($storageId, $path, $isTrashcan = false)
	{
		$storage = Storage::loadById($storageId);
		if (!$storage)
		{
			$this->errorCollection[] = new Error(
				Loc::getMessage('DISK_BREADCRUMBS_ERROR_COULD_NOT_FIND_FOLDER'), self::ERROR_COULD_NOT_FIND_FOLDER
			);

			$this->sendJsonErrorResponse();
		}

		$securityContext = $storage->getCurrentUserSecurityContext();
		if (!$storage->getRootObject()->canRead($securityContext))
		{
			$this->sendJsonAccessDeniedResponse();
		}

		if (!$isTrashcan)
		{
			$baseUrlFolderList = $storage->getProxyType()->getBaseUrlFolderList();
		}
		else
		{
			$baseUrlFolderList = $storage->getProxyType()->getBaseUrlTashcanList();
		}

		if (mb_strpos($path, $baseUrlFolderList) !== 0)
		{
			if ($storage->getProxyType() instanceof \Bitrix\Disk\ProxyType\Common)
			{
				$path .= 'path/';
				if (mb_strpos($path, $baseUrlFolderList) !== 0)
				{
					$this->sendJsonErrorResponse();
				}
			}
			else
			{
				$this->sendJsonErrorResponse();
			}
		}

		$relativePath = mb_substr($path, mb_strlen($baseUrlFolderList) - 1);

		if ($relativePath !== '/')
		{
			$relativePath = rtrim($relativePath, '/');
		}
		if (!$relativePath)
		{
			$this->sendJsonErrorResponse();
		}

		$decodedPath = array();
		foreach (explode('/', $relativePath) as $piece)
		{
			$decodedPath[] = Encoding::convertEncodingToCurrent(urldecode($piece));
		}

		$relativePath = implode('/', $decodedPath);

		$urlManager = \Bitrix\Disk\Driver::getInstance()->getUrlManager();
		$data = $urlManager->resolvePathUnderRootObject($storage->getRootObject(), $relativePath);

		$titleForCurrentUser = $storage->getProxyType()->getTitleForCurrentUser();
		if($isTrashcan)
		{
			$titleForCurrentUser = Loc::getMessage('DISK_BREADCRUMBS_TRASHCAN_NAME');
		}

		$html = $this->getHtml(
			array(
				'STORAGE_ID' => $storage->getId(),
				'BREADCRUMBS_ROOT' => array(
					'NAME' => $titleForCurrentUser,
					'LINK' => $baseUrlFolderList,
					'ID' => $storage->getRootObjectId(),
				),
				'BREADCRUMBS' => $this->getBreadcrumbs(
					$baseUrlFolderList,
					$data['RELATIVE_ITEMS'],
					$data['RELATIVE_PATH'],
					$isTrashcan
				),
			)
		);

		$this->sendJsonSuccessResponse(array(
			'html' => $html,
		));
	}

	protected function getHtml(array $parameters)
	{
		global $APPLICATION;

		ob_start();
		$APPLICATION->IncludeComponent(
			'bitrix:disk.breadcrumbs',
			'',
			$parameters
		);

		return ob_get_clean();
	}

	protected function getBreadcrumbs($pathToFolderList, $relativeItems, $relativePath, $isTrashcan = false)
	{
		$crumbs = array();

		$parts = explode('/', trim($relativePath, '/'));
		foreach ($relativeItems as $i => $item)
		{
			if (empty($item))
			{
				continue;
			}

			$itemPath = implode('/', (array_slice($parts, 0, $i + 1)));
			if ($isTrashcan)
			{
				$item['NAME'] = \Bitrix\Disk\Ui\Text::cleanTrashCanSuffix($item['NAME']);
			}

			$crumbs[] = array(
				'ID' => $item['ID'],
				'NAME' => $item['NAME'],
				'LINK' => rtrim($pathToFolderList . $itemPath, '/') . '/'
			);
		}

		return $crumbs;
	}
}

$controller = new DiskBreadcrumbsAjaxController();
$controller
	->setActionName(\Bitrix\Main\Application::getInstance()->getContext()->getRequest()->getQuery('action'))
	->exec()
;
