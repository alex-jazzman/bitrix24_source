declare type CountersUpdateSystemDeps = {
	chatCounterRepository: ChatCounterRepository,
	dispatcher: ActionDispatcher,
	restorer: CounterRestorer,
	readRequestQueue: ReadRequestQueue,
}