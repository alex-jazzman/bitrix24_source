<?php
declare(strict_types=1);

namespace Rarus\Sms4b\Encoding;

class Service
{

    /**
     * @param string $message
     *
     * @return array
     */
    public function encodeMessage(string $message): array
    {
        $instance = Encoding::createInstanceByMessage($message);

        if (LANG_CHARSET !== 'UTF-8') {
            //Принудительная конвертация всей строки в UTF-8 (для возможности распознавания спец-символов) и
            //преобразование HTML-кодов в символы
            $message = html_entity_decode(mb_convert_encoding($message, 'UTF-8', LANG_CHARSET), ENT_COMPAT | ENT_HTML401,
                'UTF-8');
        }

        return [$instance->encode($message), $instance->getCode()];
    }

    /**
     * @param string   $message
     * @param Encoding $encoding
     *
     * @return string
     */
    public function decodeMessage(string $message, Encoding $encoding): string
    {
        return $encoding->decode($message);
    }
}