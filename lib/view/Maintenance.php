<?php
class Maintenance extends View {

    private function _chkPartsValid($data) {
        $ret    = [];

        if (!empty($data["_dirty"])) {
            $data["Parts"]["id"]        = "";
            $data["Parts"]["parent"]    = "";
            $table                      = $this->{"Model.Master"}->Source->find("PartsType", ["Where" => ["id" => $data["Parts"]["type"]]], "first");
            $table                      = $table["PartsType"]["table_name"];
            $ret[$data["_id"]]      = [
                "Parts" => $this->{"Model.Master"}->Source->chkValid("Parts", $data["Parts"]),
                "Attr"  => $this->{"Model.Master"}->Source->chkValid($table, $data["Attr"])
            ];
        }

        foreach ($data["Child"] as $child) {
            $ret   += $this->_chkPartsValid($child);
        }

        return $ret;
    }

    public function ajaxPartsGallery() {
        $this->auto_render  = false;
        $user               = $this->getParams("User");
        $page               = $this->{"Model.Master"}->getParts(compact("user"), "PartsRelation");

        echo json_encode($page);
    }

    public function ajaxPartsRender() {
        $this->auto_render  = false;
        $parts              = $this->getParams("Request");
        $html               = $this->Viewer->view($parts["Parts"]["type"], $parts);
        $error              = $this->_chkPartsValid($parts);

        echo json_encode(compact("html", "error"));
    }

    public function ajaxPageRender() {
        $this->auto_render  = false;
        $page               = $this->getParams("Request");
        $parts              = $this->{"Model.Master"}->getPage(["id" => $page["page"]]);
        $page               = $parts["Page"];
        unset($parts["Page"]);

        echo json_encode(["Page" => $page] + ["Parts" => $parts]);
    }

    public function ajaxPageSave() {
        $this->auto_render  = false;
        $request            = $this->getParams("Request");
        $result             = $this->{"Model.Master"}->savePage($request["Page"] + ["user" => $this->getParams("User")], $request["Parts"]);
        foreach ($request["Removed"] as $removed) {
            $result         = array_merge($result, $this->{"Model.Master"}->deleteParts($removed));
        }

        echo json_encode($result);
    }
}
