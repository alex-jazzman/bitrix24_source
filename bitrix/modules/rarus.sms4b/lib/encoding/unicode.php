<?php
declare(strict_types=1);

namespace Rarus\Sms4b\Encoding;


class Unicode extends Encoding
{
    private const ENCODING_CODE = 1;

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
        return bin2hex(mb_convert_encoding($message, 'UCS-2', 'UTF-8'));
    }

    /**
     * @param string $message
     *
     * @return string
     */
    public function decode(string $message): string
    {
        $msgDecodeToUtf8 = mb_convert_encoding(parent::wrapperHex2bin($message), 'UTF-8', 'UCS-2');

        return mb_encode_numericentity($msgDecodeToUtf8, [0x0, 0xffff, 0, 0xffff], 'UTF-8');
    }
}