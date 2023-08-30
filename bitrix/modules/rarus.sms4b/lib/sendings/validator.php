<?php
declare(strict_types=1);

namespace Rarus\Sms4b\Sendings;

use Bitrix\Main\Localization\Loc;
use Rarus\Sms4b\Sendings\Exceptions\Sms4bValidationError;
use Rarus\Sms4b\Sendings\Messages\Message;

class Validator
{
    /**
     * @const PHONE_PATTERN string - шаблон телефонного номера
     */
    const PHONE_PATTERN = "/^[+]?[78]?[(]?([93]{1}\d{2})[)]?(\d{7})$/";

    const MIN_ACTUAL_DATA_IN_MINUTES = 15;
    const MAX_ACTUAL_DATA_IN_DAYS = 14;

    /**
     * @param Sending $sending
     *
     * @throws Sms4bValidationError
     */
    public function validate(Sending $sending): void
    {
        $this->validateNumbers($sending);
        $this->validateMessages($sending);
        $this->validateDateTime($sending);
        $this->validateAllowedDeliveryInterval($sending);
    }

    /**
     * @param Sending $sending
     *
     * @throws Sms4bValidationError
     */
    private function validateMessages(Sending $sending): void
    {
        foreach ($sending->getMessages() as $message) {
            /**
             * @var Message $message
             */
            if (empty($message->getText())) {
                $sending->getMessages()->detach($message);
            }
        }
        if ($sending->getMessages()->count() === 0) {
            throw new Sms4bValidationError(Loc::getMessage('SMS4B_VALIDATION_NO_TEXT'));
        }
    }

    /**
     * @param Sending $sending
     *
     * @throws Sms4bValidationError
     */
    private function validateNumbers(Sending $sending): void
    {
        foreach ($sending->getMessages() as $message) {
            /**
             * @var Message $message
             */
            if (empty($message->getDestination())) {
                $sending->getMessages()->detach($message);
            }
        }

        if($sending->getMessages()->count() === 0) {
            throw new Sms4bValidationError(Loc::getMessage('SMS4B_VALIDATION_NO_NUMBER'));
        }
    }

    /**
     * @param Sending $sending
     *
     * @throws Sms4bValidationError
     * @throws \Exception
     */
    private function validateDateTime(Sending $sending): void
    {
        if ($sending->getDateStart() instanceof \DateTime && $sending->getDateActual() instanceof \DateTime) {

            $dateStart = clone $sending->getDateStart();
            $dateActual = clone $sending->getDateActual();

            if ($dateStart > $dateActual) {
                throw new Sms4bValidationError(Loc::getMessage('SMS4B_VALIDATION_INVALID_DATE_START'));
            }

            if ($dateActual < $dateStart->add(new \DateInterval('PT' . self::MIN_ACTUAL_DATA_IN_MINUTES . 'M'))) {
                throw new Sms4bValidationError(Loc::getMessage('SMS4B_VALIDATION_INVALID_DATE_ACTUAL_1'));
            }

            if ($dateActual > $dateStart->add(new \DateInterval('P' . self::MAX_ACTUAL_DATA_IN_DAYS . 'D'))) {
                throw new Sms4bValidationError(Loc::getMessage('SMS4B_VALIDATION_INVALID_DATE_ACTUAL_2'));
            }
        }

    }

    /**
     * @param Sending $sending
     *
     * @throws Sms4bValidationError
     */
    private function validateAllowedDeliveryInterval(Sending $sending): void
    {
        $allowedDeliveryInterval = $sending->getAllowedDeliveryInterval();
        if ($allowedDeliveryInterval !== '' && $allowedDeliveryInterval !== null) {
            $low = \ord('A');
            $hoursLimit = 24;
            $allowedFrom = \ord($allowedDeliveryInterval[0]) - $low;
            $allowedTo = \ord($allowedDeliveryInterval[1]) - $low;

            if ($allowedFrom < 0
                || $allowedFrom >= $hoursLimit
                || $allowedTo < 0
                || $allowedTo >= $hoursLimit
                || \strlen($allowedDeliveryInterval) !== 2) {
                throw new Sms4bValidationError(Loc::getMessage('SMS4B_VALIDATION_DELIVERY_INTERVAL'));
            }
        }
    }
}