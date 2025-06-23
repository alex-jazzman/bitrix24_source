<?php

namespace Bitrix\Crm\Service\Timeline\Item\LogMessage\Booking;

use Bitrix\Crm\Service\Timeline\Item\LogMessage;
use Bitrix\Crm\Service\Timeline\Layout\Body\ContentBlock;
use Bitrix\Crm\Service\Timeline\Layout\Body\ContentBlock\Client;
use Bitrix\Crm\Service\Timeline\Layout\Common\Icon;
use Bitrix\Crm\Service\Timeline\Layout\Header\Tag;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\PhoneNumber\Parser;
use Bitrix\Crm\Service\Timeline\Item\Mixin\CalendarSharing\ContactTrait;

class BookingCreationError extends LogMessage
{
	use ContactTrait;

	public function getType(): string
	{
		return 'BookingCreationError';
	}

	public function getTitle(): ?string
	{
		return Loc::getMessage('CRM_TIMELINE_LOG_BOOKING_CREATION_ERROR_TITLE') ?? '';
	}

	public function getTags(): ?array
	{
		return [
			'error' => new Tag(
				Loc::getMessage('CRM_TIMELINE_LOG_BOOKING_CREATION_ERROR_TAG') ?? '',
				Tag::TYPE_FAILURE
			)
		];
	}

	public function getIconCode(): ?string
	{
		return Icon::INFO;
	}

	public function getContentBlocks(): ?array
	{
		$result = [
			'bookingCreatedContent' => (new ContentBlock\Text())
				->setValue(Loc::getMessage('CRM_TIMELINE_LOG_BOOKING_CREATION_ERROR_TEXT') ?? ''),
		];

		$clientBlock = $this->getClientBlock();
		if ($clientBlock)
		{
			$result['clientBlock'] = $clientBlock;
		}

		return $result;
	}

	private function getClientBlock(): ?ContentBlock
	{
		$settings = $this->getModel()->getSettings();

		$entityType = $settings['entityTypeId'] ?? null;
		$entityId = $settings['entityId'] ?? null;
		$phoneNumber = $settings['phoneNumber'] ?? null;
		$entityTypeId = $entityType ? \CCrmOwnerType::ResolveID($entityType) : null;

		if (
			isset($entityTypeId)
			&& isset($entityId)
			&& isset($phoneNumber)
		)
		{
			$parsedPhoneNumber =
				$phoneNumber
					? Parser::getInstance()?->parse($phoneNumber)
					: null
			;

			$client = (new Client(
				[
					'ENTITY_ID' => $entityTypeId,
					'ENTITY_TYPE_ID' => $entityId,
					'TYPE' => 'PHONE',
					'VALUE' => $phoneNumber,
					'FORMATTED_VALUE' => $parsedPhoneNumber ? $parsedPhoneNumber->format() : '',
					'TITLE' => $this->getContactName($entityTypeId, $entityId),
					'SHOW_NAME' => 1,
					'SHOW_URL' => $this->getContactUrl($entityTypeId, $entityId),
				],
				Client::BLOCK_WITH_FORMATTED_VALUE
			));

			return $client
				->setTitle(Loc::getMessage('CRM_TIMELINE_LOG_BOOKING_CREATION_ERROR_CLIENT'))
				->build()
			;
		}

		return null;
	}
}
