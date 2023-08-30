<?php
declare(strict_types=1);

namespace Rarus\Sms4b\Encoding;


use Bitrix\Main\Localization\Loc;
use Rarus\Sms4b\Exceptions\Sms4bException;

abstract class Encoding
{

    abstract public function encode(string $message): string;

    abstract public function decode(string $message): string;

    abstract public static function getCode(): int;

    /**
     * @param int $code
     *
     * @return Encoding
     * @throws Sms4bException
     */
    public static function createInstanceByEncodingCode(int $code): Encoding
    {
        if ($code === Gsm::getCode()) {
            $instance = new Gsm();
        } elseif ($code === Unicode::getCode()) {
            $instance = new Unicode();
        } else {
            throw new Sms4bException(Loc::getMessage('SMS4B_ENCODING_ERROR') . $code . '.');
        }

        return $instance;
    }


    /**
     * @param string $message
     *
     * @return Encoding
     */
    public static function createInstanceByMessage(string $message): Encoding
    {
        if (self::isMessageSuitableForGsm($message)) {
            $instance = new Gsm();
        } else {
            $instance = new Unicode();
        }

        return $instance;
    }

    /**
     * @param string $message
     *
     * @return bool
     */
    private static function isMessageSuitableForGsm(string $message): bool
    {
        //–егул€рка найдЄт любой символ, кроме разрешЄнных дл€ отправки в GSM-кодировке.
        $regExp = '/[^\n\r !"#$%&\'()*+,\\-.\\/0-9:;<=>?@A-Za-z]/';
        return preg_match($regExp, $message) === 0;
    }

    /**
     * @param string $message
     *
     * @return string
     */
    protected function wrapperHex2bin(string $message): string
    {
        $hex2bin = hex2bin($message);
        if ($hex2bin === false) {
            return '';
        }

        return $hex2bin;
    }

}