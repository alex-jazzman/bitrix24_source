// Mirrors the pattern of `Bitrix\Bizproc\Automation\Helper::unConvertExpressions()`
// (`bizproc/lib/automation/helper.php`): the `{{...}}` notation of the automation designer. The
// leading `[^=]` keeps the inline calc form `{{= ... }}` out of it, exactly as the server does.
// The bound on the content is ours, not the server's: without it a lazy scan of a value full of
// unclosed `{{` is O(n^2), and no caption of a field of a document is that long.
export const AUTOMATION_SOURCE = '\\{\\{([^=][\\s\\S]{0,500}?)\\}\\}';
