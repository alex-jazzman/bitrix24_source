<?php

namespace Bitrix\Crm\Integration\Calendar\Notification;

use Bitrix\Calendar\Core\Event\Event;
use Bitrix\Calendar\Sharing;
use Bitrix\Calendar\Sharing\Link\EventLink;
use Bitrix\Calendar\Sharing\Link\CrmDealLink;
use Bitrix\Crm;

class NotificationService
{
	private const TEMPLATE_SHARING_EVENT_INVITATION = 'SHARING_EVENT_INVITATION';
	private const TEMPLATE_SHARING_EVENT_AUTO_ACCEPTED = 'SHARING_EVENT_ACCEPTED_2';
	private const TEMPLATE_SHARING_EVENT_CANCELLED_LINK_ACTIVE = 'SHARING_EVENT_CANCELLED_1';
	private const TEMPLATE_SHARING_EVENT_CANCELLED = 'SHARING_EVENT_CANCELLED_2';

	protected CrmDealLink $crmDealLink;
	protected Event $event;
	protected EventLink $eventLink;

	/**
	 * @param Crm\ItemIdentifier $entity
	 * @return bool
	 */
	public static function canSendMessage(Crm\ItemIdentifier $entity): bool
	{
		$repo = Crm\MessageSender\Channel\ChannelRepository::create($entity);
		$channel = $repo->getDefaultForSender(Crm\Integration\NotificationsManager::getSenderCode());
		if (is_null($channel))
		{
			return false;
		}

		return $channel->checkChannel()->isSuccess();
	}

	/**
	 * @param CrmDealLink $crmDealLink
	 * @return $this
	 */
	public function setCrmDealLink(CrmDealLink $crmDealLink): self
	{
		$this->crmDealLink = $crmDealLink;
		return $this;
	}

	/**
	 * @param EventLink $eventLink
	 * @return $this
	 */
	public function setEventLink(Eventlink $eventLink): self
	{
		$this->eventLink = $eventLink;
		return $this;
	}

	/**
	 * @param Event $event
	 * @return $this
	 */
	public function setEvent(Event $event): self
	{
		$this->event = $event;
		return $this;
	}

	/**
	 * @return bool
	 */
	public function sendCrmSharingInvited(): bool
	{
		$manager = Sharing\Helper::getOwnerInfo($this->crmDealLink->getOwnerId());
		$placeholders = [
			'NAME' => Sharing\Helper::getPersonFullNameLoc($manager['name'], $manager['lastName']),
			'URL' => Sharing\Helper::getShortUrl($this->crmDealLink->getUrl()),
			'FIRST_NAME' => $manager['name'], // for sms
		];

		return $this->sendMessage(self::TEMPLATE_SHARING_EVENT_INVITATION, $placeholders);
	}

	/**
	 * @return bool
	 */
	public function sendCrmSharingAutoAccepted(): bool
	{
		$manager = Sharing\Helper::getOwnerInfo($this->crmDealLink->getOwnerId());
		$fullName = Sharing\Helper::getPersonFullNameLoc($manager['name'], $manager['lastName']);
		$placeholders = [
			'NAME' => $fullName,
			'DATE' => Sharing\Helper::formatDate($this->event->getStart()),
			'EVENT_URL' => Sharing\Helper::getShortUrl($this->eventLink->getUrl()),
			'VIDEOCONFERENCE_URL' => Sharing\Helper::getShortUrl($this->eventLink->getUrl() . Sharing\Helper::ACTION_CONFERENCE),

			'EVENT_NAME' => Sharing\SharingEventManager::getSharingEventNameByUserName($fullName), // for title
		];

		return $this->sendMessage(self::TEMPLATE_SHARING_EVENT_AUTO_ACCEPTED, $placeholders);
	}

	/**
	 * @return bool
	 */
	public function sendCrmSharingCancelled(): bool
	{
		$manager = Sharing\Helper::getOwnerInfo($this->crmDealLink->getOwnerId());

		$template = self::TEMPLATE_SHARING_EVENT_CANCELLED;
		$placeholders = [
			'NAME' => Sharing\Helper::getPersonFullNameLoc($manager['name'], $manager['lastName']),
			'DATE' => Sharing\Helper::formatDate($this->event->getStart()),
			'EVENT_URL' => Sharing\Helper::getShortUrl($this->eventLink->getUrl()),
		];

		if ($this->crmDealLink->isActive())
		{
			$template = self::TEMPLATE_SHARING_EVENT_CANCELLED_LINK_ACTIVE;
			$placeholders['URL'] = Sharing\Helper::getShortUrl($this->crmDealLink->getUrl());
		}

		return $this->sendMessage($template, $placeholders);
	}

	/**
	 * @param string $template
	 * @param array $placeholders
	 * @return bool
	 * @throws \Bitrix\Main\ArgumentException
	 */
	protected function sendMessage(string $template, array $placeholders): bool
	{
		$channel = $this->getEntityChannel(\CCrmOwnerType::Deal, $this->crmDealLink->getEntityId());
		if (is_null($channel))
		{
			return false;
		}

		$to = $this->getToEntity($channel, $this->crmDealLink->getContactId(), $this->crmDealLink->getContactType());
		if (!$to)
		{
			return false;
		}

		return (new Crm\MessageSender\SendFacilitator\Notifications($channel))
			->setTo($to)
			->setPlaceholders($placeholders)
			->setTemplateCode($template)
			->setLanguageId('ru')
			->send()
			->isSuccess()
		;
	}

	/**
	 * @param int $entityTypeId
	 * @param int $entityId
	 * @return Crm\MessageSender\Channel|null
	 */
	private function getEntityChannel(int $entityTypeId, int $entityId): ?Crm\MessageSender\Channel
	{
		$entity = new Crm\ItemIdentifier($entityTypeId, $entityId);
		$repo = Crm\MessageSender\Channel\ChannelRepository::create($entity);
		$channel = $repo->getDefaultForSender(Crm\Integration\NotificationsManager::getSenderCode());
		if (is_null($channel))
		{
			return null;
		}

		return $channel;
	}

	/**
	 * @param Crm\MessageSender\Channel $channel
	 * @param int $contactId
	 * @return false|mixed
	 */
	private function getToEntity(Crm\MessageSender\Channel $channel, int $contactId, int $contactTypeId)
	{
		return current(array_filter($channel->getToList(), static function ($to) use ($contactId, $contactTypeId) {
			return $to->getAddressSource()->getEntityId() === $contactId && $to->getAddressSource()->getEntityTypeId() === $contactTypeId;
		}));
	}
}