/* eslint-disable */
type ServerError = {
	code?: string | number | null;
	message?: string | null;
	userFacing?: boolean;
};

type ServerErrorResponse = {
	errors?: ServerError[];
};

declare namespace BX.BIConnector {
	function resolveErrorHtml(response: unknown, fallbackPhrase: string | null | undefined): string;

	function getServerErrorHtml(response: unknown): string | null;

	function isNetworkError(response: unknown): boolean;

	function getUserFacingErrorHtml(error: unknown): string | null;
}
