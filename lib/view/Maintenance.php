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

    public function ajaxPartsRender() {
        $this->auto_render  = false;
        $parts              = $this->getParams("Request");
        $type               = $parts["Parts"]["type"];
        $html               = $this->Viewer->view($parts["Parts"]["type"], $parts);
        $error              = $this->_chkPartsValid($parts);

        echo json_encode(compact("html", "error"));
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

    public function ajaxPageRender() {
        $this->auto_render  = false;
        $page               = $this->getParams("Request");
        $page               = $this->{"Model.Master"}->getPage(["Where" => $page + ["parent" => ["Relation" => "IS", "Value" => "NULL"]]]);

        echo json_encode($page);
    }
}
