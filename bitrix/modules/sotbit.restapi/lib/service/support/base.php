<?php

declare(strict_types=1);

namespace Sotbit\RestAPI\Service\Support;

use Sotbit\RestAPI\Exception\SupportException;
use Sotbit\RestAPI\Repository\SupportRepository;
use Sotbit\RestAPI\Service\BaseService;
use Respect\Validation\Validator as v;

abstract class Base extends BaseService
{
    protected $supportRepository;

    public function __construct(
        SupportRepository $supportRepository
    ) {
        $this->supportRepository = $supportRepository;
    }
}
