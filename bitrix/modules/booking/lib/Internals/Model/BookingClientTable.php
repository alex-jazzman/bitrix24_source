<?php

declare(strict_types=1);

namespace Bitrix\Booking\Internals\Model;

use Bitrix\Booking\Entity\Booking\BookingVisitStatus;
use Bitrix\Booking\Internals\Model\Enum\EntityType;
use Bitrix\Main\ArgumentException;
use Bitrix\Main\Entity\BooleanField;
use Bitrix\Main\Entity\DataManager;
use Bitrix\Main\Entity\ExpressionField;
use Bitrix\Main\ORM\Data\Internal\DeleteByFilterTrait;
use Bitrix\Main\ORM\Fields\IntegerField;
use Bitrix\Main\ORM\Fields\Relations\Reference;
use Bitrix\Main\ORM\Fields\StringField;
use Bitrix\Main\ORM\Fields\Validators\LengthValidator;
use Bitrix\Main\ORM\Query\Join;
use Bitrix\Main\SystemException;

/**
 * Class BookingClientTable
 *
 * DO NOT WRITE ANYTHING BELOW THIS
 *
 * <<< ORMENTITYANNOTATION
 * @method static EO_BookingClient_Query query()
 * @method static EO_BookingClient_Result getByPrimary($primary, array $parameters = [])
 * @method static EO_BookingClient_Result getById($id)
 * @method static EO_BookingClient_Result getList(array $parameters = [])
 * @method static EO_BookingClient_Entity getEntity()
 * @method static \Bitrix\Booking\Internals\Model\EO_BookingClient createObject($setDefaultValues = true)
 * @method static \Bitrix\Booking\Internals\Model\EO_BookingClient_Collection createCollection()
 * @method static \Bitrix\Booking\Internals\Model\EO_BookingClient wakeUpObject($row)
 * @method static \Bitrix\Booking\Internals\Model\EO_BookingClient_Collection wakeUpCollection($rows)
 */
final class BookingClientTable extends DataManager
{
	use DeleteByFilterTrait;

	public static function getTableName(): string
	{
		return 'b_booking_booking_client';
	}

	/**
	 * @throws SystemException|ArgumentException
	 */
	public static function getMap(): array
	{
		return array_merge(
			static::getScalarMap(),
			static::getReferenceMap(),
		);
	}

	private static function getScalarMap(): array
	{
		return [
			(new IntegerField('ID'))
				->configurePrimary()
				->configureAutocomplete(),

			(new IntegerField('ENTITY_ID'))
				->configureRequired()
				->configureDefaultValue(0),

			(new IntegerField('CLIENT_TYPE_ID'))
				->configureRequired(),

			(new IntegerField('CLIENT_ID'))
				->configureRequired(),

			(new BooleanField('IS_PRIMARY'))
				->configureValues('N', 'Y')
				->configureDefaultValue('N')
				->configureRequired(),

			(new StringField('ENTITY_TYPE'))
				->addValidator(new LengthValidator(1, 255))
				->configureRequired(),
		];
	}

	private static function getReferenceMap(): array
	{
		return [
			(new Reference(
				'BOOKING',
				BookingTable::getEntity(),
				Join::on('this.ENTITY_ID', 'ref.ID')
					->where('this.ENTITY_TYPE', EntityType::Booking->value)
			)),
			(new Reference(
				'WAIT_LIST',
				BookingTable::getEntity(),
				Join::on('this.ENTITY_ID', 'ref.ID')
					->where('this.ENTITY_TYPE', EntityType::WaitList->value)
			)),
			(new Reference(
				'CLIENT_TYPE',
				ClientTypeTable::getEntity(),
				Join::on('this.CLIENT_TYPE_ID', 'ref.ID')
			))->configureJoinType(Join::TYPE_INNER),

			(new ExpressionField(
				'IS_RETURNING',
				"(
					(CASE WHEN EXISTS (
						SELECT 1
						FROM b_booking_booking_client booking_client
						JOIN b_booking_booking booking on booking.ID = booking_client.ENTITY_ID 
							AND booking_client.ENTITY_TYPE = '" . EntityType::Booking->value . "'
						JOIN b_booking_wait_list_item wait_list_item on wait_list_item.ID = booking_client.ENTITY_ID 
							AND booking_client.ENTITY_TYPE = '" . EntityType::WaitList->value . "'
						WHERE
							(booking_client.CLIENT_TYPE_ID = %s
							AND booking_client.CLIENT_ID = %s
							AND booking.DATE_FROM < " . strtotime("midnight") . "
							AND booking.DATE_TO < " . strtotime("tomorrow") - 1 . "
							AND booking.VISIT_STATUS IN (
								'" . BookingVisitStatus::Visited->value . "',
								'" . BookingVisitStatus::Unknown->value . "'
							))
							OR
							(
								booking_client.CLIENT_TYPE_ID = %s
								AND booking_client.CLIENT_ID = %s
								AND UNIX_TIMESTAMP(wait_list_item.CREATED_AT) > " . strtotime("midnight") . "
								AND UNIX_TIMESTAMP(wait_list_item.CREATED_AT) < " . strtotime("tomorrow") - 1 . "
							)
						LIMIT 1
					) THEN TRUE ELSE FALSE END)
				)",
				[
					'CLIENT_TYPE_ID',
					'CLIENT_ID',
					'CLIENT_TYPE_ID',
					'CLIENT_ID',
				],
				[
					'data_type' => 'boolean',
				]
			)),
		];
	}
}
