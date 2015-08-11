<?php
class Maintenance extends View {

    private function _chkPartsValid($data) {
        $ret    = [];

        if (!empty($data["dirty"])) {
            $table                      = $this->{"Model.Master"}->Source->find("PartsType", ["Where" => ["id" => $data["Parts"]["type"]]], "first");
            $table                      = $table["PartsType"]["table_name"];
            $ret[$data["Parts"]["id"]]      = [
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
        $page               = [];
        $user               = ["Relation" => "IS", "Value" => "NULL"];
        $path               = "template";
        $sharedParts        = $this->{"Model.Master"}->getPage(compact("user", "path"));
        $userParts          = $this->{"Model.Master"}->getPage(["user" => $this->getParams("User")] + compact("path"));
        foreach (["shared" => $sharedParts, "user" => $userParts] as $type => $partsList) {
            unset($partsList["Page"]);
            $page[$type]    = [];
            if (!empty($partsList)) {
                foreach ($partsList as $parts) {
                    $parts["html"]  = $this->Viewer->view($parts["Parts"]["type"], $parts);
                    $page[$type][]  = $parts;
                }
            }
        }

        echo json_encode($page);
    }

    public function ajaxPartsRender() {
        $this->auto_render  = false;
        $parts              = $this->getParams("Request");
        $html               = $this->Viewer->view($parts["Parts"]["type"], $parts);
        $error              = $this->_chkPartsValid($parts);

        echo json_encode(compact("html", "error"));
    }

    public function ajaxPartsType() {
        $this->auto_render  = false;
        $types              = [];
        $forms              = [];

        foreach ($this->{"Model.Master"}->Source->find("PartsType") as $type) {
            $types[]        = ["value" => $type["PartsType"]["id"], "name" => $type["PartsType"]["name"]];
            $form           = [];
            foreach (array_search_key("Field", $this->{"Model.Master"}->Schema[$type["PartsType"]["table_name"]]) as $field) {
                if (array_search($field, ["id", "child"]) !== false) continue;
                $form[]     = [
                    "name"  => $field,
                    "type"  => "text",
                    "label" => ucwords(str_replace("_", " ", $field)),
                ];
            }
            $forms[$type["PartsType"]["id"]]    = $form;
        }

        echo json_encode(compact("types", "forms"));
    }

    public function ajaxPageList() {
        $this->auto_render  = false;
        $pages              = [];
        $pages[]            = ["id" => null, "title" => "New Page"];

        foreach ($this->{"Model.Master"}->Source->find("Page", ["Field" => ["id", "title"], "Where" => ["user" => $this->getParams("User")]]) as $page) {
            $pages[]    = $page["Page"];
        }

        echo json_encode($pages);
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
