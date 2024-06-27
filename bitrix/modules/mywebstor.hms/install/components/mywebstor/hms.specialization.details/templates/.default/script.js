BX.ready(function () {
    BX.namespace("BX.MyWebstor.HMS.Specialization");

    BX.MyWebstor.HMS.Specialization.Details = function (entityEditorID, specializationID) {
        var entityEditor = BX.UI.EntityEditor.get(entityEditorID);
        if (!entityEditor) return;

        this.ID = specializationID;
        this.entityEditor = entityEditor;

        BX.addCustomEvent("BX.UI.EntityEditorAjax:onSubmit", function (data, response) {
            if (response.status != "success" || !data) return;

            var toolbar = BX.UI.ToolbarManager.getDefaultToolbar();
            if (!toolbar) return;

            var titleContainer = toolbar.titleContainer.querySelector("#pagetitle");
            if (!titleContainer) return;

            var title = data.USER_TITLE || "";

            titleContainer.innerText = title;
            document.title = title;
        });
    };

    BX.MyWebstor.HMS.Specialization.Details.prototype.delete = function () {
        var specializationID = this.ID;
        if (specializationID <= 0) return;

        BX.ajax
            .runComponentAction("mywebstor:hms.specialization.details", "delete", {
                mode: "class",
                data: {
                    specializationID,
                },
            })
            .then((result) => {
                BX.SidePanel.Instance.close();

                var parent = window.parent,
                    gridManager;
                if (!parent.BX.Main || !(gridManager = parent.BX.Main.gridManager)) return;
                var grids = gridManager.data;
                grids.forEach((grid) => grid.instance.reload());
            })
            .catch((result) => {
                var errors = result.errors.reduce((str, error) => {
                    str += error.message + "\n\t<br>";
                    return str;
                }, "");

                this.entityEditor._toolPanel.addError(errors);
                this.entityEditor._toolPanel.setVisible(true);
            });
    };

    BX.MyWebstor.HMS.Specialization.Details.Instance = null;
    BX.MyWebstor.HMS.Specialization.Details.getInstance = function (entityEditorID, specializationID) {
        if (BX.MyWebstor.HMS.Specialization.Details.Instance === null) BX.MyWebstor.HMS.Specialization.Details.Instance = new BX.MyWebstor.HMS.Specialization.Details(entityEditorID, specializationID);

        return BX.MyWebstor.HMS.Specialization.Details.Instance;
    };
});
