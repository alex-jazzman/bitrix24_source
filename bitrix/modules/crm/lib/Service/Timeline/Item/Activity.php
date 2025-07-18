<?php

namespace Bitrix\Crm\Service\Timeline\Item;

use Bitrix\Crm\Activity\Provider\ProviderManager;
use Bitrix\Crm\Integration\StorageManager;
use Bitrix\Crm\Service\Timeline\Config;
use Bitrix\Crm\Service\Timeline\Item\Interfaces\Deadlinable;
use Bitrix\Crm\Service\Timeline\Layout;
use Bitrix\Crm\Service\Timeline\Layout\Action\JsEvent;
use Bitrix\Crm\Service\Timeline\Layout\Footer\Button;
use Bitrix\Crm\Service\Timeline\Layout\Menu\MenuItemFactory;
use Bitrix\Crm\Settings\WorkTime;
use Bitrix\Crm\Timeline\Entity\NoteTable;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\Type\DateTime;
use CCrmActivity;
use CCrmDateTimeHelper;
use CCrmOwnerType;

abstract class Activity extends Configurable implements Deadlinable
{
	protected const NEAREST_WORK_DATE_DAYS = 3;
	protected const NEAREST_WORK_DATE_HOURS = 1;

	/**
	 * Should return unique identifier of an activity template
	 *
	 * @return string
	 */
	abstract protected function getActivityTypeId(): string;

	public function getType(): string
	{
		return sprintf('Activity:%s', $this->getActivityTypeId());
	}

	protected function isBuiltOnlyForCurrentUser(): bool
	{
		return true;
	}

	public function getSort(): array
	{
		if (!$this->getModel()->isScheduled())
		{
			return parent::getSort();
		}

		if ($this->isIncomingChannel())
		{
			// incoming channel activities have a negative timestamp because they must be first in the list
			// and must be sorted in reverse order:
			return [
				$this->getDate()
					? -(int)$this->getDate()->getTimestamp()
					: 0,
				$this->getActivityId()
			];
		}

		return [
			$this->getDeadline()
				? (int)$this->getDeadline()->getTimestamp()
				: PHP_INT_MAX,
			$this->getActivityId()
		];
	}

	public function getCounterType(): ?string
	{
		if (!$this->getModel()->isScheduled())
		{
			return false;
		}

		if ($this->isOverdue())
		{
			return Layout\Icon::COUNTER_TYPE_DANGER;
		}
		if ($this->isIncomingChannel())
		{
			return Layout\Icon::COUNTER_TYPE_SUCCESS;
		}

		return null;
	}

	public function getBackgroundColorToken(): string
	{
		if (!$this->getModel()->isScheduled())
		{
			return parent::getBackgroundColorToken();
		}

		if ($this->isOverdue())
		{
			return Layout\Icon::BACKGROUND_FAILURE;
		}
		if ($this->isIncomingChannel())
		{
			return Layout\Icon::BACKGROUND_PRIMARY_ALT;
		}

		return parent::getBackgroundColorToken();
	}

	/**
	 * @return array<string, Layout\Menu\MenuItem>
	 */
	public function getMenuItems(): array
	{
		$activityId = $this->getActivityId();
		$menuItems = parent::getMenuItems() ?? [];
		if ($this->isScheduled())
		{
			$editMenuItem = $this->createEditMenuItem($activityId);
			if ($editMenuItem)
			{
				$menuItems['edit'] = $editMenuItem;
			}

			$postponeMenuItem = $this->createPostponeMenuItem($activityId);
			if ($postponeMenuItem)
			{
				$menuItems['postpone'] = $postponeMenuItem;
			}
		}
		else
		{
			$menuItems['view'] = MenuItemFactory::createViewMenuItem()
				->setAction((new Layout\Action\JsEvent('Activity:View'))
					->addActionParamInt('activityId', $activityId))
			;
		}

		$moveToMenuItem = $this->createMoveToMenuItem($activityId);
		if ($moveToMenuItem)
		{
			$menuItems['moveTo'] = $moveToMenuItem;
		}

		$menuItems['delete'] = $this->createDeleteMenuItem($activityId);

		$filterRelated = $this->createFilterRelatedMenuItem($activityId);
		if ($filterRelated)
		{
			$menuItems['filterRelated'] = $filterRelated;
		}

		return $menuItems;
	}

	protected function isOverdue(): bool
	{
		if (!$this->isScheduled())
		{
			return false;
		}
		$lightCounterAt = $this->getLightCounterAt();
		if ($lightCounterAt)
		{
			return (new DateTime())->getTimestamp() > $lightCounterAt->getTimestamp();
		}
		return false;
	}

	protected function isIncomingChannel(): bool
	{
		return $this->getAssociatedEntityModel()?->get('IS_INCOMING_CHANNEL') === 'Y';
	}

	protected function isPlanned(): bool
	{
		return is_null($this->getAssociatedEntityModel()?->get('ORIGIN_ID'));
	}

	final protected function getScheduleButton(
		string $jsEventName,
		string $description = '',
		string $buttonType = Button::TYPE_SECONDARY,
	): ?Button
	{
		if (!$this->getContext()->getUserPermissions()->item()->canUpdate(
			$this->getContext()->getEntityTypeId(),
			$this->getContext()->getEntityId()
		))
		{
			return null;
		}

		$nearestWorkday = (new WorkTime())
			->detectNearestWorkDateTime(self::NEAREST_WORK_DATE_DAYS, self::NEAREST_WORK_DATE_HOURS)
		;

		$buttonTitle = Loc::getMessage('CRM_COMMON_ACTION_SCHEDULE_ACTIVITY') ?? Loc::getMessage('CRM_COMMON_ACTION_SCHEDULE');

		return (new Button($buttonTitle, $buttonType))
			->setAction(
				(new JsEvent($jsEventName))
					->addActionParamInt('activityId', $this->getActivityId())
					->addActionParamString('scheduleDate', $nearestWorkday->toString())
					->addActionParamInt('scheduleTs', $nearestWorkday->getTimestamp())
					->addActionParamString('description', $description)
			)
		;
	}

	protected function getCompleteButton(): ?Layout\Header\ChangeStreamButton
	{
		if (!$this->isScheduled())
		{
			return null;
		}

		return (new Layout\Header\ChangeStreamButton())
			->setTypeComplete()
			->setDisableIfReadonly()
			->setAction($this->getCompleteAction())
		;
	}

	protected function getCompleteAction(): Layout\Action\RunAjaxAction
	{
		return (new Layout\Action\RunAjaxAction('crm.timeline.activity.complete'))
			->addActionParamInt('activityId', $this->getActivityId())
			->addActionParamInt('ownerTypeId', $this->getContext()->getEntityTypeId())
			->addActionParamInt('ownerId', $this->getContext()->getEntityId())
			->setAnimation(Layout\Action\Animation::disableItem()->setForever())
		;
	}

	public function getChangeDeadlineAction(): Layout\Action\RunAjaxAction
	{
		return (new Layout\Action\RunAjaxAction('crm.timeline.activity.setDeadline'))
			->addActionParamInt('activityId', $this->getActivityId())
			->addActionParamInt('ownerTypeId', $this->getContext()->getEntityTypeId())
			->addActionParamInt('ownerId', $this->getContext()->getEntityId())
		;
	}

	protected function getActivityId(): int
	{
		return $this->getModel()->getAssociatedEntityId();
	}

	public function getDeadline(): ?DateTime
	{
//		$model = $this->getAssociatedEntityModel();
//		if (!$model)
//		{
//			return null;
//		}
//
//		$deadline = $model->get('START_TIME') ?? $model->get('DEADLINE');

		$deadline = $this->getAssociatedEntityModel()?->get('DEADLINE');

		return ($deadline && !CCrmDateTimeHelper::IsMaxDatabaseDate($deadline))
			? DateTime::createFromUserTime($deadline)
			: null
		;
	}

	protected function getLightCounterAt(): ?DateTime
	{
		$lightCounterAt = $this->getAssociatedEntityModel()?->get('LIGHT_COUNTER_AT');

		return ($lightCounterAt && !CCrmDateTimeHelper::IsMaxDatabaseDate($lightCounterAt))
			? $lightCounterAt
			: null;
	}

	protected function getDeleteConfirmationText(): string
	{
		return Loc::getMessage('CRM_TIMELINE_ACTIVITY_DELETION_CONFIRM');
	}

	protected function getDeleteTagConfirmationText(): string
	{
		return Loc::getMessage('CRM_TIMELINE_ACTIVITY_DELETE_TAG_CONFIRM');
	}

	protected function createDeleteMenuItem(int $activityId): ?Layout\Menu\MenuItem
	{
		return MenuItemFactory::createDeleteMenuItem()
			->setAction(
				(new Layout\Action\JsEvent('Activity:Delete'))
					->addActionParamInt('activityId', $activityId)
					->addActionParamInt('ownerTypeId', $this->getContext()->getEntityTypeId())
					->addActionParamInt('ownerId', $this->getContext()->getEntityId())
					->addActionParamString('confirmationText', $this->getDeleteConfirmationText())
					->setAnimation(Layout\Action\Animation::disableItem()->setForever())
			)
		;
	}

	protected function createDeleteTagMenuItem(int $activityId): ?Layout\Menu\MenuItem
	{
		return MenuItemFactory::createDeleteTagMenuItem()
			->setAction(
				(new Layout\Action\JsEvent('Activity:DeleteTag'))
					->addActionParamInt('activityId', $activityId)
					->addActionParamInt('ownerTypeId', $this->getContext()->getEntityTypeId())
					->addActionParamInt('ownerId', $this->getContext()->getEntityId())
					->addActionParamString('confirmationText', $this->getDeleteTagConfirmationText())
			)
		;
	}

	protected function createPostponeMenuItem(int $activityId): ?Layout\Menu\MenuItemSubmenu
	{
		if (!$this->canPostpone())
		{
			return null;
		}

		return
			(new Layout\Menu\MenuItemSubmenu(
				Loc::getMessage('CRM_TIMELINE_POSTPONE'),
				$this->getPostponeMenu($activityId)
			))
				->setSort(9950)
				->setHideIfReadonly()
		;
	}

	protected function getPostponeMenu(int $activityId): Layout\Menu
	{
		$postponeValues = [
			3600 => Loc::getMessage('CRM_TIMELINE_POSTPONE_1H'),
			7200 => Loc::getMessage('CRM_TIMELINE_POSTPONE_2H'),
			10800 => Loc::getMessage('CRM_TIMELINE_POSTPONE_3H'),
			86400 => Loc::getMessage('CRM_TIMELINE_POSTPONE_1D'),
			172800 => Loc::getMessage('CRM_TIMELINE_POSTPONE_2D'),
			259200 => Loc::getMessage('CRM_TIMELINE_POSTPONE_3D'),
		];

		$postponeMenu = new Layout\Menu();

		foreach ($postponeValues as $offset => $title)
		{
			$postponeMenu->addItem(
				'postpone_' . $offset,
				(new Layout\Menu\MenuItem($title))
					->setAction(
						(new Layout\Action\RunAjaxAction('crm.timeline.activity.postpone'))
							->addActionParamInt('activityId', $activityId)
							->addActionParamInt('offset', $offset)
							->addActionParamInt('ownerTypeId', $this->getContext()->getEntityTypeId())
							->addActionParamInt('ownerId', $this->getContext()->getEntityId())
							->setAnimation(Layout\Action\Animation::disableBlock()->setForever())
					)
			);
		}

		return $postponeMenu;
	}

	private function createEditMenuItem(int $activityId): ?Layout\Menu\MenuItem
	{
		if (!$this->canEdit())
		{
			return null;
		}

		return MenuItemFactory::createEditMenuItem()
			->setAction(
				(new Layout\Action\JsEvent('Activity:Edit'))
					->addActionParamInt('activityId', $activityId)
			)
		;
	}

	private function createMoveToMenuItem(int $activityId): ?Layout\Menu\MenuItem
	{
		if (
			$this->hasUpdatePermission()
			&& $this->isIncomingChannel()
			&& $this->canMoveTo()
		)
		{
			return MenuItemFactory::createMoveToMenuItem()
				->setAction(
					(new Layout\Action\JsEvent('Activity:MoveTo'))
						->addActionParamInt('activityId', $activityId)
						->addActionParamInt('ownerTypeId', $this->getContext()->getEntityTypeId())
						->addActionParamInt('ownerId', $this->getContext()->getEntityId())
						->addActionParamInt('categoryId', $this->getContext()->getEntityCategoryId())
				)
				->setScopeWeb() // temporary disable action for mobile app
			;
		}

		return null;
	}

	private function canEdit(): bool
	{
		$provider = CCrmActivity::GetActivityProvider($this->getAssociatedEntityModel()?->toArray());
		$providerTypeId = $this->getAssociatedEntityModel()?->get('PROVIDER_TYPE_ID');
		$direction = $this->getAssociatedEntityModel()?->get('DIRECTION');

		if ($provider && !$provider::isTypeEditable($providerTypeId, $direction))
		{
			return false;
		}

		return $this->hasUpdatePermission();
	}

	protected function canMoveTo(): bool
	{
		return false;
	}

	protected function hasUpdatePermission(): bool
	{
		return CCrmActivity::CheckItemUpdatePermission(
			$this->getAssociatedEntityModel()?->toArray(),
			$this->getContext()->getUserPermissions()->getCrmPermissions(),
		);
	}

	protected function canPostpone(): bool
	{
		if (!$this->getDeadline()) // items without deadline can not be postponed
		{
			return false;
		}

		return CCrmActivity::CheckItemPostponePermission(
			$this->getAssociatedEntityModel()?->toArray(),
			$this->getContext()->getUserPermissions()->getCrmPermissions()
		);
	}

	protected function fetchStorageFiles(): array
	{
		$storageTypeId = $this->getAssociatedEntityModel()?->get('STORAGE_TYPE_ID');
		if (empty($storageTypeId))
		{
			return [];
		}

		$storageElementIds = $this->getAssociatedEntityModel()?->get('STORAGE_ELEMENT_IDS');
		if (empty($storageElementIds))
		{
			return [];
		}

		$elementIds = unserialize($storageElementIds, ['allowed_classes' => false]);
		if (!is_array($elementIds))
		{
			return [];
		}

		$result = [];
		foreach ($elementIds as $elementId)
		{
			$fileInfo = StorageManager::getFileInfo(
				$elementId,
				$storageTypeId,
				false,
				['OWNER_TYPE_ID' => CCrmOwnerType::Activity, 'OWNER_ID' => $this->getActivityId()]
			);

			if (is_array($fileInfo))
			{
				$result[] = $fileInfo;
			}
		}

		return $result;
	}

	protected function fetchAudioRecordList(): array
	{
		$files = $this->fetchStorageFiles();
		if (empty($files))
		{
			return [];
		}

		return array_values(
			array_filter(
				$files,
				static fn($row) => in_array(GetFileExtension(mb_strtolower($row['NAME'])), Config::ALLOWED_AUDIO_EXTENSIONS)
			)
		);
	}

	public function getNoteItemType(): int
	{
		return NoteTable::NOTE_TYPE_ACTIVITY;
	}

	public function getNoteItemId(): int
	{
		return $this->getActivityId();
	}

	protected function isTagDeleted(): bool
	{
		$activitySettings = $this->getAssociatedEntityModel()?->get('SETTINGS');

		return (isset($activitySettings['TAGS_DELETED']) && $activitySettings['TAGS_DELETED'] === 'Y');
	}

	protected function createFilterRelatedMenuItem(int $activityId): ?Layout\Menu\MenuItem
	{
		$entityModel = $this->getModel()->getAssociatedEntityModel();

		if (!$entityModel || !ProviderManager::isRelatedFilterProvider((string)$entityModel->get('PROVIDER_ID')))
		{
			return null;
		}

		$title = $entityModel->get('SUBJECT');
		if ($title === '')
		{
			$activityFields = $entityModel->toArray();
			if (!isset($activityFields['COMPLETED']))
			{
				$activityFields['COMPLETED'] = $this->isScheduled() ? 'N' : 'Y';
			}
			$provider = \CCrmActivity::GetActivityProvider($activityFields);
			$title = $provider ? $provider::getActivityTitle($activityFields) : "ACTIVITY_{$activityId}";
		}

		return MenuItemFactory::createFilterRelatedMenuItem()
			->setAction(
				(new Layout\Action\JsEvent('Activity:FilterRelated'))
					->addActionParamInt('activityId', $activityId)
					->addActionParamString('activityLabel', $title)
					->addActionParamString(
						'filterId',
						sprintf('%s_%d_timeline_history',
							strtolower(CCrmOwnerType::ResolveName($this->getContext()->getEntityTypeId())),
							$this->getContext()->getEntityId()
						)
					)
			)->setScopeWeb() // temporary disable action for mobile app
		;
	}
}
