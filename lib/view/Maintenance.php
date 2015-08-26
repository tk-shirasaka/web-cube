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
        $getForm            = function ($schema, $prefix) {
            $form   = [];
            foreach ($schema as $field) {
                if (array_search($field["Field"], ["id", "page", "parent", "user", "child", "model", "isAjax"]) !== false) continue;
                $input          = "text";
                $options        = [];
                if (!empty($field["Range"])) {
                    $input      = "select";
                    foreach ($field["Range"] as $key => $val) {
                        $options[] = ["name" => $val, "value" => $key];
                    }
                } else if (!empty($field["Boolean"])) {
                    $input      = "checkbox";
                }
                $form[]     = [
                    "name"          => $prefix. ".". $field["Field"],
                    "type"          => $input,
                    "options"       => $options,
                    "label"         => ucwords(str_replace("_", " ", $field["Field"])),
                    "placeholder"   => $field["Description"],
                ];
            }
            return $form;
        };

        $forms["Page"]      = $getForm($this->{"Model.Master"}->Schema["Page"], "Page");
        $forms["Parts"]     = $getForm($this->{"Model.Master"}->Schema["Parts"], "Parts");
        foreach ($this->{"Model.Master"}->Source->find("PartsType") as $type) {
            $types[]                            = ["value" => $type["PartsType"]["id"], "name" => $type["PartsType"]["name"]];
            $forms[$type["PartsType"]["id"]]    = $getForm($this->{"Model.Master"}->Schema[$type["PartsType"]["table_name"]], "Attr");
        }

        echo json_encode(compact("types", "forms"));
    }

    public function ajaxPartsSave() {
        $this->auto_render  = false;
        $parts              = $this->getParams("Request");

        echo json_encode($this->{"Model.Master"}->saveParts($parts));
    }

    public function ajaxPartsRemove() {
        $this->auto_render  = false;
        $parts              = $this->getParams("Request");

        echo json_encode($this->{"Model.Master"}->removeParts($parts));
    }

    public function ajaxPageList() {
        $this->auto_render  = false;
        $pages              = [];

        foreach ($this->{"Model.Master"}->Source->find("Page", ["Field" => ["id", "title"], "Where" => ["user" => $this->getParams("User"), "isAjax" => 0]]) as $page) {
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
        $page               = $this->getParams("Request.Page") + ["user" => $this->getParams("User")];
        echo json_encode($this->{"Model.Master"}->savePage($page));
    }
}
