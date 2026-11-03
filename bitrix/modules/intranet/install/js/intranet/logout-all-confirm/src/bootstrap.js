export function bootstrap({ ready, restore }: { ready: Function, restore: Function }): void
{
	ready(restore);
}
