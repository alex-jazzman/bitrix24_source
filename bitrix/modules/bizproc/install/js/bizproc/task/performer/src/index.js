export { PerformerOutcome, TasksPerformer } from './performer/performer';
export type {
	PerformerOptions,
	PerformerOutcomeValue,
	PerformerResult,
	PerformerTask,
	PerformerTaskButton,
	PerformerTaskControls,
} from './performer/performer';
// DTO-01: the records of `PerformerResult` speak this vocabulary, so whoever reads the result reads it too.
export { TaskOutcomeStatus } from './const/outcome';
export type { TaskOutcome, TaskOutcomeError, TaskOutcomeStatusValue } from './const/outcome';
// How one task of the pass ends: the surface that opens a task answers the mechanics in these words.
export { TaskPassStatus } from './rule/one-by-one-rule';
export type { TaskPass, TaskPassStatusValue } from './rule/one-by-one-rule';
