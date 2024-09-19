<?php

declare(strict_types=1);

$files = [];
foreach(glob(__DIR__ . '/dependencies/*.php' ?: []) as $file) {
    $files[] = $file;
}

$dependencies = array_map(static function($file) {
    return require $file;
}, $files);

return array_merge_recursive(...$dependencies);