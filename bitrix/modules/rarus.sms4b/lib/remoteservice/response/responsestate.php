<?php
declare(strict_types=1);

namespace Rarus\Sms4b\RemoteService\Response;

class ResponseState
{
    /**
     * @var integer Response status code.
     */
    private $code;
    /**
     * @var string Description of the response status.
     */
    private $description;

    /**
     * @param integer $code {@see code}
     * @param string $description {@see description}
     */
    public function __construct($code, $description)
    {
        $this->code = $code;
        $this->description = $description;
    }

    /**
     * @see code
     * @return integer
     */
    public function getCode(): int
    {
        return $this->code;
    }

    /**
     * @see description
     * @return string
     */
    public function getDescription(): string
    {
        return $this->description;
    }
}
