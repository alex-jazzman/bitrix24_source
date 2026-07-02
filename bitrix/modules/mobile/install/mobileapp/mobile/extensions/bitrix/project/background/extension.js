(function() {
	class ProjectBackgroundAction
	{
		constructor()
		{
			BX.addCustomEvent(
				'projectbackground::project::action',
				(data) => ProjectBackgroundAction.executeAction(data),
			);
		}

		static async executeAction(data)
		{
			const { ProjectOpener } = await requireLazy('project/opener');

			void ProjectOpener.open(data ?? {});
		}
	}

	new ProjectBackgroundAction();
})();
