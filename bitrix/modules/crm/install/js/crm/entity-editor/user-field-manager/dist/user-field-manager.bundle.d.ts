/* eslint-disable */
type ValidationResult = {
	addError(error: unknown): void;
};

type ValidationPromise = PromiseLike<void> & {
	fulfill(): void;
};

declare namespace BX.Crm {
	class DateValidationUserFieldManager extends BX.UI.EntityUserFieldManager {
		static create(id: string, settings: Record<string, unknown>): DateValidationUserFieldManager;
		validate(result: ValidationResult): ValidationPromise;
	}
}
