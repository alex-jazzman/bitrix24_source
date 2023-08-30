<?php
declare(strict_types=1);

namespace Rarus\Sms4b\Encoding;


use JetBrains\PhpStorm\Pure;

class Gsm extends Encoding
{
    private const ENCODING_CODE = 0;

    /**
     * @return int
     */
    public static function getCode(): int
    {
        return self::ENCODING_CODE;
    }

    /**
     * @param string $message
     *
     * @return string
     */
    public function encode(string $message): string
    {
        return bin2hex(strtr($message, ['$' => chr(0x02), '@' => chr(0x00)]));
    }

    /**
     * @param string $message
     *
     * @return string
     */
    public function decode(string $message): string
    {
        $message = strtr(parent::wrapperHex2bin($message), [
            chr(0x02) => '$',
            //Обратную замену тажке необходимо выполнить, чтобы, если в исходном сообщении были $ и/или @,
            //они не остались там без изменения.
            '$'       => chr(0x02),
            chr(0x00) => '@',
            '@'       => chr(0x00),
        ]);

        return $message;
    }
}