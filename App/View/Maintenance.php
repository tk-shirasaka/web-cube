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

    public function ajaxPartsSample() {
        $this->auto_render  = false;
        $user               = $this->getParams("User");
        $shared             = ["Relation" => ">", "Value" => 0];
        $parts              = $this->{"Model.Master"}->getParts(compact("user", "shared"));
        $html               = $this->Viewer->view("Block", ["Parts" => [],"Child" => $parts]);

        echo json_encode(["sample" => compact("parts", "html")]);
    }

    public function ajaxPartsType() {
        $this->auto_render  = false;
        $types              = [];
        $forms              = [];
        $getForm            = function ($schema, $prefix) {
            $form   = [];
            foreach ($schema as $field) {
                if (array_search($field["Field"], ["id", "page", "parent", "user", "model", "isAjax"]) !== false) continue;
                $input          = "text";
                $options        = [];
                if (array_search($field["Type"], ["int", "tinyint"])) $input = "number";
                if ($field["Field"] === "child") {
                    $input      = "hidden";
                } else if (!empty($field["Range"]) or !empty($field['Foreign'])) {
                    $input      = "select";
                    if (empty($field["Range"])) $field["Range"] = [];
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

        $forms["Parts"]     = $getForm($this->{"Model.Master"}->Schema["Parts"], "Parts");
        $forms["Page"]      = $getForm($this->{"Model.Master"}->Schema["Page"], "Page");
        $forms["Image"]      = $getForm($this->{"Model.Master"}->Schema["Image"], "Image");
        foreach ($this->{"Model.Master"}->Source->find("PartsType") as $type) {
            $types[]                            = ["value" => $type["PartsType"]["id"], "name" => $type["PartsType"]["name"]];
            $forms[$type["PartsType"]["id"]]    = $getForm($this->{"Model.Master"}->Schema[$type["PartsType"]["table_name"]], "Attr");
        }

        echo json_encode(compact("types", "forms"));
    }

    public function ajaxPageList() {
        $this->auto_render  = false;
        $pages              = [];

        foreach ($this->{"Model.Master"}->Source->find("Page", ["Field" => ["id", "title", "path"], "Where" => ["user" => $this->getParams("User"), "isAjax" => 0]]) as $page) {
            $pages[]    = $page["Page"];
        }

        echo json_encode($pages);
    }

    public function ajaxPageRender() {
        $this->auto_render  = false;
        $page               = $this->getParams("Request.Page");
        $parts              = $this->{"Model.Master"}->getPage(["id" => $page["id"]]);
        $page               = $parts["Page"];
        unset($parts["Page"]);

        echo json_encode(["Page" => $page] + ["Parts" => $parts]);
    }

    public function ajaxPartsRender() {
        $this->auto_render  = false;
        $parts              = $this->getParams("Request");
        $html               = $this->Viewer->view($parts["Parts"]["type"], $parts);

        echo json_encode(compact("html"));
    }

    public function ajaxPageSave() {
        $this->auto_render  = false;
        $page               = $this->getParams("Request.Page");
        echo json_encode($this->{"Model.Master"}->savePage($page));
    }

    public function ajaxPartsSave() {
        $this->auto_render  = false;
        $parts              = $this->getParams("Request");

        echo json_encode($this->{"Model.Master"}->saveParts($parts));
    }

    public function ajaxPageRemove() {
        $this->auto_render  = false;
        $page               = $this->getParams("Request.Page");

        echo json_encode($this->{"Model.Master"}->removePage($page["id"]));
    }

    public function ajaxPartsRemove() {
        $this->auto_render  = false;
        $parts              = $this->getParams("Request");

        echo json_encode($this->{"Model.Master"}->removeParts($parts));
    }
}
