<?php

declare(strict_types=1);

return [
    'settings' => [
        'displayErrorDetails'               => false,
        'addContentLengthHeader'            => false, // Allow the web server to send the content-length header
        'determineRouteBeforeAppMiddleware' => true,
    ],
];
