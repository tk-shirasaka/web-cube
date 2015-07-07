<?php
class Maintenance extends View {

    private function _chkPartsValid($data) {
        $ret    = [];

        if (!empty($data["_dirty"])) {
            $data["Parts"]["id"]        = "dummy";
            $data["Parts"]["parent"]    = "";
            $ret[$data["_id"]]      = [
                "Parts" => $this->{"Model.Master"}->Source->chkValid("Parts", $data["Parts"])
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

    public function ajaxPageRender() {
        $this->auto_render  = false;
        $page               = $this->getParams("Request");
        $page               = $this->{"Model.Master"}->getPage(["Where" => $page]);

        echo json_encode($page);
    }
}
