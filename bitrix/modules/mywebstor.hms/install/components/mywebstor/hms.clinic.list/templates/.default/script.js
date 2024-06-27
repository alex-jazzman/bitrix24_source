BX.ready(function () {
    BX.namespace("BX.MyWebstor.HMS.Clinic");

    BX.MyWebstor.HMS.Clinic.List = function (gridID) {
        var grid = BX.Main.gridManager.getById(gridID);
        if (!grid) throw new Error("Grid not found");

        this.gridID = gridID;
        this.grid = grid.instance;
    };

    BX.MyWebstor.HMS.Clinic.List.prototype.delete = function (clinicID = 0) {
        if (clinicID <= 0) return;

        BX.ajax
            .runComponentAction("mywebstor:hms.clinic.details", "delete", {
                mode: "class",
                data: {
                    clinicID,
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
                        TITLE: "Delete error №" + clinicID,
                        TEXT: errors,
                    },
                ];
                this.grid.messages.show();
            });
    };

    BX.MyWebstor.HMS.Clinic.List.Instance = null;
    BX.MyWebstor.HMS.Clinic.List.getInstance = function (gridID) {
        if (BX.MyWebstor.HMS.Clinic.List.Instance === null) BX.MyWebstor.HMS.Clinic.List.Instance = new BX.MyWebstor.HMS.Clinic.List(gridID);

        return BX.MyWebstor.HMS.Clinic.List.Instance;
    };
});
