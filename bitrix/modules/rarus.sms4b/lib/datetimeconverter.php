<?php
declare(strict_types=1);

namespace Rarus\Sms4b;

trait DateTimeConverter
{
    /**
     * Перебирает массив и перезаписывает объекты datetime на строковое представление даты-времени
     *
     * @param array $data - входящие данные
     *
     * @return array - массив с перезаписанными объектами datetime
     */
    public static function dateToStringInArray(array $data): array
    {
        foreach ($data as $key => $val) {
            if ($val instanceof \Bitrix\Main\Type\Date) {
                $data[$key] = $val->toString();
            }
        }

        return $data;
    }

    /**
     * @param \Bitrix\Main\Type\DateTime|null $date
     *
     * @return \DateTime|null
     * @throws \Exception
     */
    public static function bitrixDateTimeToPhpDateTime(?\Bitrix\Main\Type\DateTime $date): ?\DateTime
    {
        if($date === null) {
            return null;
        }
        return new \DateTime($date->format('Y-m-d\\TH:i:s'));
    }

    /**
     * @param \DateTime|null $date
     *
     * @return \Bitrix\Main\Type\DateTime|null
     */
    public static function phpDateTimeToBitrixDateTime(?\DateTime $date): ?\Bitrix\Main\Type\DateTime
    {
        if($date === null) {
            return null;
        }
        return \Bitrix\Main\Type\DateTime::createFromPhp($date);
    }

    /**
     * @param \DateTime|null $date
     *
     * @return string
     */
    public static function dateTimeForUser(?\DateTime $date): string
    {
        return ($date instanceof \DateTime) ? $date->format('d.m.Y H:i:s') : '';
    }

}