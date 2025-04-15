<?php

namespace Bitrix\Booking\Internals\Service\Overbooking;

use Bitrix\Booking\Entity\Booking\Booking;
use Bitrix\Booking\Entity\Booking\BookingCollection;
use Bitrix\Booking\Entity\DatePeriod;
use DateInterval;

class OverlapPolicy
{
	private const CHECK_SHIFT_MINUTES = 1;
	private const MAX_ALLOWED_INTERSECTIONS_CNT = 1;

	public function getIntersectionsList(
		Booking $booking,
		BookingCollection $intersectingBookingCollection
	): BookingCollection
	{
		$emptyResult = new BookingCollection();

		if ($intersectingBookingCollection->isEmpty())
		{
			return $emptyResult;
		}

		$datePeriodCollection = $booking->getEventDatePeriodCollection();
		foreach ($datePeriodCollection as $datePeriod)
		{
			$currentDatePeriod = new DatePeriod(
				$datePeriod->getDateFrom(),
				$datePeriod->getDateFrom()->add(
					new DateInterval('PT' . self::CHECK_SHIFT_MINUTES . 'M')
				)
			);

			while ($datePeriod->contains($currentDatePeriod))
			{
				$intersectionsCntByResource = [];
				foreach ($booking->getResourceCollection() as $resource)
				{
					$intersectionsCntByResource[$resource->getId()] = 0;
				}

				$result = new BookingCollection();

				foreach ($intersectingBookingCollection as $intersectingBooking)
				{
					$doIntersect = $intersectingBooking->doEventsIntersect($currentDatePeriod);
					if ($doIntersect)
					{
						foreach ($intersectingBooking->getResourceCollection() as $intersectingBookingResource)
						{
							if (!isset($intersectionsCntByResource[$intersectingBookingResource->getId()]))
							{
								continue;
							}

							$intersectionsCntByResource[$intersectingBookingResource->getId()]++;
						}

						$result->add($intersectingBooking);
					}

					foreach ($intersectionsCntByResource as $intersectionsCnt)
					{
						if ($intersectionsCnt > self::MAX_ALLOWED_INTERSECTIONS_CNT)
						{
							return $result;
						}
					}
				}

				$currentDatePeriod = $currentDatePeriod->addMinutes(self::CHECK_SHIFT_MINUTES);
			}
		}

		return $emptyResult;
	}
}
