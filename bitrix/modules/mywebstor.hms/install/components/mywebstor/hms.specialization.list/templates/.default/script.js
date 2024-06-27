BX.ready(function () {
    BX.namespace("BX.MyWebstor.HMS.Specialization");

    BX.MyWebstor.HMS.Specialization.List = function (gridID) {
        var grid = BX.Main.gridManager.getById(gridID);
        if (!grid) throw new Error("Grid not found");

        this.gridID = gridID;
        this.grid = grid.instance;
    };

    BX.MyWebstor.HMS.Specialization.List.prototype.delete = function (specializationID = 0) {
        if (specializationID <= 0) return;

        BX.ajax
            .runComponentAction("mywebstor:hms.specialization.details", "delete", {
                mode: "class",
                data: {
                    specializationID,
                },
            })
            .then((result) => {
                this.grid.reloadTable();
            })
            .catch((result) => {
                var errors = result.errors.shift().message;
                this.grid.arParams.MESSAGES = [
                    {
                        TYPE: "error",
                        TITLE: "Delete error №" + specializationID,
                        TEXT: errors,
                    },
                ];
                this.grid.messages.show();
            });
    };

    BX.MyWebstor.HMS.Specialization.List.Instance = null;
    BX.MyWebstor.HMS.Specialization.List.getInstance = function (gridID) {
        if (BX.MyWebstor.HMS.Specialization.List.Instance === null) BX.MyWebstor.HMS.Specialization.List.Instance = new BX.MyWebstor.HMS.Specialization.List(gridID);

        return BX.MyWebstor.HMS.Specialization.List.Instance;
    };
});
