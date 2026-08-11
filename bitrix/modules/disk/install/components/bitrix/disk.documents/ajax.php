<?php

if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true) die();

use Bitrix\Disk;
use Bitrix\Disk\Configuration;
use Bitrix\Disk\Driver;
use Bitrix\Disk\File;
use Bitrix\Disk\Integration\Bitrix24Manager;
use Bitrix\Disk\Internals\Error\Error;
use Bitrix\Main;
use Bitrix\Main\Localization\Loc;

Main\Loader::requireModule('disk');

final class DiskDocumentsController extends Disk\Internals\Engine\Controller
{

	public function copyToMeAction(Disk\Document\TrackedObject $trackedObject)
	{
		$currentUserId = $this->getCurrentUser()->getId();
		$userStorage = Driver::getInstance()->getStorageByUserId($currentUserId);

		if (!$userStorage)
		{
			$this->addError(new Error('Could not find storage for current user'));

			return null;
		}
		$folder = $userStorage->getFolderForCreatedFiles() ?? $userStorage->getFolderForSavedFiles();
		if (!$folder)
		{
			$this->addError(new Error('Could not find folder for created files'));

			return null;
		}
		$file = $trackedObject->getRealObject();
		if (!$file)
		{
			$this->addError(new Error('Cannot obtain file'));

			return null;
		}
		$securityContext = $file->getStorage()->getCurrentUserSecurityContext();
		if (!$file->canRead($securityContext))
		{
			$this->addError(new Error('Cannot obtain file'));

			return null;
		}

		$newFile = $file->getRealObject()->copyTo($folder, $currentUserId, true);

		if (!$newFile)
		{
			$this->addError(new Error('Could not copy file to storage for current user'));

			return null;
		}

		$newFile->renameInternal(Loc::getMessage('DISK_DOCUMENTS_DUPLICATE_NEW_NAME', ['#DOC_NAME#' => $file->getNameWithoutExtension()]) . '.' . $file->getExtension(), true);
	}

	public function showFileHistoryAction(Disk\Document\TrackedObject $trackedObject): Main\Engine\Response\AjaxJson
	{
		if (!$trackedObject->canRead($this->getCurrentUser()->getId()))
		{
			if ($trackedObject->getUserId() == $this->getCurrentUser()->getId())
			{
				$trackedObject->delete();
			}

			return Main\Engine\Response\AjaxJson::createDenied()->setStatus('403 Forbidden');
		}

		return new Main\Engine\Response\Component(
			'bitrix:disk.file.history',
			'',
			[
				'STORAGE' => $trackedObject->getFile()->getStorage(),
				'FILE' => $trackedObject->getFile(),
			],
		);
	}

	public function getMenuActionsAction(Disk\Document\TrackedObject $trackedObject, array $analytics = [])
	{
		$urlManager = Driver::getInstance()->getUrlManager();
		if (!$trackedObject->canRead($this->getCurrentUser()->getId()))
		{
			if ($trackedObject->getUserId() == $this->getCurrentUser()->getId())
			{
				$trackedObject->delete();
			}

			return Main\Engine\Response\AjaxJson::createDenied()->setStatus('403 Forbidden');
		}

		$file = $trackedObject->getFile();
		/** @see \Bitrix\Disk\Controller\TrackedObject::downloadAction */
		$downloadUri = (new Disk\Controller\TrackedObject())->getActionUri('download', ['id' => $trackedObject->getId()]);

		$actions = [];

		$supportsUnifiedLink = $file->supportsUnifiedLink();
		$fileType = (int)$file->getTypeFile();
		$isBoard = $fileType === Disk\TypeFile::FLIPCHART;

		if (!$isBoard && $supportsUnifiedLink)
		{
			$viewUnifiedLinkOptions = [];

			if (!empty($analytics) && Disk\Analytics\Availability::isAvailableForObject($file))
			{
				$viewUnifiedLinkOptions['additionalQueryParams']['analytics'] = $analytics;
			}

			$viewUnifiedLink = $urlManager->getUnifiedLink($file, $viewUnifiedLinkOptions);

			$actions[] = [
				'id' => 'view',
				'text' => Loc::getMessage('DISK_DOCUMENTS_ACT_OPEN'),
				'href' => $viewUnifiedLink,
				'target' => '_blank',
			];
		}

		$actions[] = [
			'id' => 'download',
			'icon' => '/bitrix/js/ui/actionpanel/images/ui_icon_actionpanel_download.svg',
			'text' => Loc::getMessage('DISK_DOCUMENTS_ACT_DOWNLOAD'),
			'href' => $downloadUri,
		];

		$belongsToDiskStorages = $this->belongsToDiskStorages($file);
		$internalLink = null;
		if ($belongsToDiskStorages)
		{
			if ($supportsUnifiedLink)
			{
				$unifiedLinkOptions = ['absolute' => true];
				if ($trackedObject->getAttachedObjectId())
				{
					$unifiedLinkOptions['attachedId'] = $trackedObject->getAttachedObjectId();
				}
				$internalLink = $urlManager->getUnifiedLink($file, $unifiedLinkOptions);
			}
			else
			{
				$internalLink = $urlManager->getUrlFocusController('showObjectInGrid', [
					'objectId' => $file->getId(),
					'cmd' => 'show',
				], true);
			}
		}

		$supportsSharingAccessPopup = $supportsUnifiedLink;
		$sharingMode = $this->getSharingControlType($trackedObject);
		$actionToShare = $this->buildDocumentsShareMenuItems(
			$trackedObject,
			$file,
			$internalLink,
			$supportsUnifiedLink,
			$supportsSharingAccessPopup,
			$sharingMode,
			$belongsToDiskStorages,
		);

		if ($actionToShare)
		{
			$actions[] = [
				'id' => 'share-section',
				'text' => Loc::getMessage('DISK_DOCUMENTS_ACT_SHARE_COMPLEX'),
				'icon' => '/bitrix/js/ui/actionpanel/images/ui_icon_actionpanel_share.svg',
				'items' => $actionToShare,
			];
		}

		if ($trackedObject->canRename($this->getCurrentUser()->getId()))
		{
			$actions[] = [
				'id' => 'rename',
				'text' => Loc::getMessage('DISK_DOCUMENTS_ACT_RENAME'),
				'icon' => '/bitrix/js/ui/actionpanel/images/ui_icon_actionpanel_rename.svg',
			];
		}

		if ($isBoard)
		{
			$actions[] = [
				'id' => 'copyToMe',
				'text' => Loc::getMessage('DISK_DOCUMENTS_ACT_DUPLICATE'),
				'icon' => '/bitrix/js/ui/actionpanel/images/ui_icon_actionpanel_copy.svg',
				'dataset' => [
					'objectId' => $trackedObject->getFileId(),
				],
			];
		}

		if ($belongsToDiskStorages)
		{
			$actions[] = [
				'id' => 'history',
				'text' => Loc::getMessage('DISK_DOCUMENTS_ACT_SHOW_HISTORY'),
				'dataset' => [
					'objectId' => $trackedObject->getFileId(),
					'objectName' => $trackedObject->getFile()->getName(),
					'fileHistoryUrl' => $urlManager->getPathFileHistory($file),
					'blockedByFeature' => !Bitrix24Manager::isFeatureEnabled('disk_file_history'),
				],
			];
		}

		if ($trackedObject->canMarkDeleted($this->getCurrentUser()->getId()))
		{
			$actions[] = [
				'id' => 'delete',
				'text' => Loc::getMessage('DISK_DOCUMENTS_ACT_DELETE'),
				'dataset' => [
					'objectId' => $trackedObject->getFileId(),
					'objectName' => $trackedObject->getFile()->getName(),
				],
			];
		}

		if ($isBoard)
		{
			if ($trackedObject->getAttachedObjectId())
			{
				$openUrl = $urlManager->getUrlForViewAttachedBoard($file, $trackedObject->getAttachedObjectId(), false, 'boards_page');
			}
			else
			{
				$openUrl = $urlManager->getUrlForViewBoard($file, false, 'boards_page');
			}

			array_unshift(
				$actions,
				[
					'id' => 'open',
					'text' => Loc::getMessage('DISK_DOCUMENTS_ACT_OPEN'),
					'href' => $openUrl,
					'target' => '_blank',
				],
			);
		}

		return $actions;
	}

	protected function getSharingControlType(Disk\Document\TrackedObject $trackedObject): ?string
	{
		$currentUserId = $this->getCurrentUser()->getId();
		if (!$trackedObject->canChangeRights($currentUserId) && !$trackedObject->canShare($currentUserId))
		{
			return 'without-edit';
		}
		if ($trackedObject->canChangeRights($currentUserId))
		{
			return 'with-change-rights';
		}
		if ($trackedObject->canShare($currentUserId))
		{
			return 'with-sharing';
		}

		return 'without-edit';
	}

	protected function belongsToDiskStorages(File $file): bool
	{
		$storage = $file->getStorage();
		if (!$storage)
		{
			return false;
		}

		return $storage->getProxyType() instanceof Disk\ProxyType\Common
			|| $storage->getProxyType() instanceof Disk\ProxyType\Group
			|| $storage->getProxyType() instanceof Disk\ProxyType\User;
	}

	public function getInfoAction(array $trackedObjectIds): array
	{
		$result = [];
		$fileController = Main\Engine\ControllerBuilder::build(Disk\Controller\File::class, []);
		$userId = $this->getCurrentUser()?->getId();
		if (!$userId)
		{
			return $result;
		}

		/** @var Disk\Document\TrackedObject[] $batchById */
		$batchById = Disk\Document\TrackedObject::loadBatchById(
			array_keys($trackedObjectIds),
			[Disk\Document\TrackedObject::REF_OBJECT],
		);
		foreach ($batchById as $trackedObject)
		{
			$trackedObjectId = $trackedObject->getId();
			$actions = $trackedObjectIds[$trackedObjectId] ?? [];

			$result[$trackedObjectId] = [
				'shared' => null,
				'externalLink' => null,
			];

			if (!$trackedObject->canRead($userId))
			{
				continue;
			}

			if (\in_array('shared', $actions, true))
			{
				if (!$trackedObject->canShare($userId) && !$trackedObject->canChangeRights($userId))
				{
					$user = Disk\User::getById($userId);
					$result[$trackedObjectId]['shared'] = [[
						'entityId' => Disk\Sharing::CODE_USER . $userId,
						'name' => $user->getFormattedName(),
						'url' => $user->getDetailUrl(),
						'avatar' => $user->getAvatarSrc(),
						'type' => 'users',
					]];
				}
				else
				{
					$result[$trackedObjectId]['shared'] = $trackedObject->getFile()->getMembersOfSharing();
				}
			}

				if (\in_array('externalLink', $actions, true))
				{
					$file = $trackedObject->getFile();
					$externalLinkData = $fileController->getExternalLinkAction($file);
					$externalLink = $externalLinkData['externalLink'] ?? [
						'id' => null,
						'objectId' => $trackedObject->getFileId(),
					];
					$externalLink['supportsSharingAccessPopup'] = $file->supportsUnifiedLink();
					$result[$trackedObjectId]['externalLink'] = $externalLink;
				}
			}

		return $result;
	}

	public function getMenuOpenAction($trackedObjectId)
	{
		return 'someUrl';
	}

	public function formattedRowAction(int $id): mixed
	{
		$grid = new \Bitrix\Main\Engine\Response\Component(
			'bitrix:disk.documents',
			'',
			[
				'SEF_MODE' => 'N',
				'USER_ID' => (int)$this->getCurrentUser()->getId(),
				'VARIANT' => \Bitrix\Disk\Type\DocumentGridVariant::DocumentsList,
			],
			[],
			["HIDE_ICONS" => "Y"],
		);

		[$items, $nextPage] = $grid->getItems(
			[
				'TRACKED_OBJECT.OBJECT_ID' => $id,
			],
			null,
			['ACTIVITY_TIME' => 'desc'],
			$grid->getGridHeaders(),
		);

		$preparedRows = $grid->formatRows($items);

		return $preparedRows[0];
	}

	private function getExternalLinkFeature(Disk\Document\TrackedObject $trackedObject): string
	{
		$isBoardType = (int)$trackedObject->getFile()->getTypeFile() === Disk\TypeFile::FLIPCHART;

		return $isBoardType ? 'disk_board_external_link' : 'disk_manual_external_link';
	}

	private function buildDocumentsShareMenuItems(
		Disk\Document\TrackedObject $trackedObject,
		File $file,
		?string $internalLink,
		bool $supportsUnifiedLink,
		bool $supportsSharingAccessPopup,
		?string $sharingMode,
		bool $belongsToDiskStorages,
	): array
	{
		if ($supportsUnifiedLink)
		{
			return $this->buildDocumentsUnifiedShareMenuItems(
				$trackedObject,
				$file,
				$internalLink,
				$supportsSharingAccessPopup,
				$sharingMode,
				$belongsToDiskStorages,
			);
		}

		return $this->buildDocumentsLegacyShareMenuItems(
			$trackedObject,
			$file,
			$internalLink,
			$sharingMode,
			$belongsToDiskStorages,
		);
	}

	private function buildDocumentsUnifiedShareMenuItems(
		Disk\Document\TrackedObject $trackedObject,
		File $file,
		?string $internalLink,
		bool $supportsSharingAccessPopup,
		?string $sharingMode,
		bool $belongsToDiskStorages,
	): array
	{
		$items = [];

		if ($belongsToDiskStorages && $internalLink !== null)
		{
			$items[] = [
				'id' => 'internalLink',
				'text' => Loc::getMessage('DISK_DOCUMENTS_ACT_COPY_LINK'),
				'dataset' => [
					'internalLink' => $internalLink,
					'textCopied' => Loc::getMessage('DISK_DOCUMENTS_ACT_COPIED_INTERNAL_LINK'),
				],
			];
		}

		$sharingItem = $this->buildDocumentsSharingMenuItem(
			$trackedObject,
			$file,
			$supportsSharingAccessPopup,
			$sharingMode,
			Loc::getMessage('DISK_DOCUMENTS_ACT_ACCESS_BY_LINK'),
		);
		if ($sharingItem !== null)
		{
			$items[] = $sharingItem;
		}

		return $items;
	}

	private function buildDocumentsLegacyShareMenuItems(
		Disk\Document\TrackedObject $trackedObject,
		File $file,
		?string $internalLink,
		?string $sharingMode,
		bool $belongsToDiskStorages,
	): array
	{
		$items = [];

		if (Configuration::isEnabledExternalLink())
		{
			$externalLinkFeature = $this->getExternalLinkFeature($trackedObject);
			$items[] = [
				'id' => 'externalLink',
				'text' => Loc::getMessage('DISK_DOCUMENTS_ACT_GET_EXT_LINK'),
				'dataset' => [
					'shouldBlockFeature' => !Bitrix24Manager::isFeatureEnabled($externalLinkFeature),
					'blocker' => Bitrix24Manager::filterJsAction($externalLinkFeature, ''),
				],
			];
		}

		if ($belongsToDiskStorages && $internalLink !== null)
		{
			$items[] = [
				'id' => 'internalLink',
				'text' => Loc::getMessage('DISK_DOCUMENTS_ACT_COPY_INTERNAL_LINK'),
				'dataset' => [
					'internalLink' => $internalLink,
					'textCopied' => Loc::getMessage('DISK_DOCUMENTS_ACT_COPIED_INTERNAL_LINK'),
				],
			];
		}

		$sharingItem = $this->buildDocumentsSharingMenuItem(
			$trackedObject,
			$file,
			false,
			$sharingMode,
			Loc::getMessage('DISK_DOCUMENTS_ACT_SHOW_SHARING_DETAIL_2'),
		);
		if ($sharingItem !== null)
		{
			$items[] = $sharingItem;
		}

		return $items;
	}

	private function buildDocumentsSharingMenuItem(
		Disk\Document\TrackedObject $trackedObject,
		File $file,
		bool $supportsSharingAccessPopup,
		?string $sharingMode,
		string $text,
	): ?array
	{
		if ($sharingMode === null)
		{
			return null;
		}

		return [
			'id' => 'sharing',
			'text' => $text,
			'dataset' => [
				'objectId' => $trackedObject->getFileId(),
				'objectName' => $file->getName(),
				'type' => $sharingMode,
				'uniqueCode' => $supportsSharingAccessPopup ? $file->getUniqueCode() : null,
				'supportsUnifiedLink' => $supportsSharingAccessPopup ? 'true' : 'false',
				'supportsSharingAccessPopup' => $supportsSharingAccessPopup ? 'true' : 'false',
			],
		];
	}

}
