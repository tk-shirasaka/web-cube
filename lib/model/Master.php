<?php
App::Uses("Model",      "Model");
App::Uses("Utility",    "I18n");

class Master extends Model {
    public  $uses           = MST_DB;

    public function init() {
        parent::init();

        $this->_putDefault();
    }

    private function _putDefault() {
        if (empty($this->Source->show("Table"))) {
            foreach ($this->Schema as $table => $val) {
                $this->Source->create($table);
                if (empty($this->Default[$table])) continue;
 
                foreach ($this->Default[$table] as $record) {
                    foreach ($record as $field => $val) {
                        $val = trim($val);
                        if (substr($val, 0,1) === "{" and substr($val, -1,1) === "}") {
                            $val        = preg_replace("/\{(.*)\}/", "$1", $val);
                            if (defined($val)) $val = constant($val);
                        }
                        $record[$field] = $val;
                    }
                    $this->Source->save($table, $record);
                }
            }
        }
    }

    private function _getChild($id) {
        $sort   = ["row", "offset"];

        if (!($ret = $this->Source->find(["Parts", "PartsType"], ["Where" => ["parent" => $id], "Sort" => $sort]))) return false;

        foreach ($ret as $key => $parent) {
            $table  = $parent["PartsType"]["table_name"];
            $attr   = $this->Source->find($table, ["Where" => ["id" => $parent["Parts"]["id"]]]);
            if ($attr) {
                $ret[$key]["Attr"] = $attr[0][$table];
                if (!empty($ret[$key]["Attr"]["child"])) $ret[$key]["Child"] = $this->_getChild($ret[$key]["Attr"]["child"]);
            }
        }
        return $ret;
    }

    public function getPage($conditions = []) {
        $table  = ["Page", "Parts", "PartsType"];
        $sort   = ["row", "offset"];
        $where  = [
            "path"      => implode("/", $this->getParams("Path")),
            "user"      => $this->getParams("User"),
            "parent"    => ["Relation" => "IS", "Value" => "NULL"]
        ];

        if ($conditions) {
            $where  = isset($conditions["Where"]) ? $conditions["Where"] : $where;
        } else if ($this->getParams("Method") === "POST" and $this->getParams("Data.PageId")) {
            $where  = ["id" => $this->getParams("Data.PageId")];
        }

        $ret    = $this->Source->find($table, ["Where" => $where, "Sort" => $sort]);
        if (empty($ret) and $this->getParams("User") === "System") {
            $where["user"]  = "System";
            $where["path"]  = "Default";
            $ret            = $this->Source->find($table, ["Where" => $where, "Sort" => $sort]);
        }
        if (empty($ret)) {
            $where["user"]  = "System";
            $where["path"]  = "Error";
            $ret            = $this->Source->find($table, ["Where" => $where, "Sort" => $sort]);
        }
        if (!empty($ret)) {
            foreach($ret as $key => $parent) {
                $table  = $parent["PartsType"]["table_name"];
                $where  = ["id" => $parent["Parts"]["id"]];
                $attr   = $this->Source->find($table, ["Where" => $where]);
                if ($attr) {
                    $ret[$key]["Attr"] = $attr[0][$table];
                    if (!empty($ret[$key]["Attr"]["child"])) $ret[$key]["Child"] = $this->_getChild($ret[$key]["Attr"]["child"]);
                }
            }
        }
        Core::Get()->setPropaty(["page" => $ret]);

        return $ret;
    }

    public function saveParts($parts) {
        $ret            = [];
        $id             = $parts["Parts"]["id"];
        $table          = $this->Source->find("PartsType", ["Field" => ["table_name"], "Where" => ["id" => $parts["Parts"]["type"]]], "first");
        $table          = $table["PartsType"]["table_name"];
        if (!empty($parts["Child"])) $ret["Relation"] = $this->Source->save("PartsRelation", compact("id"));

        $ret["Parts"]   = $this->Source->save("Parts", $parts["Parts"]);
        $ret["Attr"]    = $this->Source->save($table, $parts["Attr"]);

        return (is_array($ret["Parts"]) and is_array($ret["Attr"]) or (isset($ret["Relation"]) and is_array($ret["Relation"]))) ? [$id => $ret] : [];
    }

    public function savePage($page, $parts, $parent = null) {
        $ret            = [];

        if (!$parent) {
            $result = $this->Source->save("Page", $page);
            $ret    = (is_array($result)) ? ["Page" => $result] : [];
        }
        foreach ($parts as $child) {
            $child["Parts"]["id"]   = (empty($child["_originalId"])) ? uniqid("", true) : $child["_originalId"];
            if (!empty($child["_dirty"])) {
                $child["Page"]              = $page;
                $child["Parts"]["page"]     = $page["id"];
                $child["Parts"]["parent"]   = $parent;
                $child["Attr"]["id"]        = $child["Parts"]["id"];
                if (!$parent) unset($child["Parts"]["parent"]);
                if (empty($child["Child"])) {
                    unset($child["Attr"]["child"]);
                } else {
                    $child["Attr"]["child"] = $child["Parts"]["id"];
                }
                $ret                        = array_merge($ret, $this->saveParts($child));
            }
            if (!empty($child["Child"])) $this->savePage($page, $child["Child"], $child["Parts"]["id"]);
        }

        return $ret;
    }

    public function deleteParts($id) {
        $ret            = [];
        $parts          = $this->Source->find(["Parts", "PartsType"], ["Where" => ["Parts.id" => $id]], "first");
        $table          = $parts["PartsType"]["table_name"];
        $ret["Attr"]    = $this->Source->delete($table, compact("id"));
        $ret["Parts"]   = $this->Source->delete("Parts", compact("id"));
        if (empty($this->Source->find("Parts", ["parent" => $id]))) $ret["Relation"] = $this->Source->delete("PartsRelation", compact("id"));

        return (is_array($ret["Parts"]) and is_array($ret["Attr"]) or (isset($ret["Relation"]) and is_array($ret["Relation"]))) ? [$id => $ret] : [];
    }

    public function getColRange() {
        return range(0, 12);
    }

    public function getOffsetRange() {
        return range(0, 11);
    }

    public function getHeaderRange() {
        $ret    = range(0, 6);
        unset($ret[0]);
        return $ret;
    }

    public function getPages() {
        $ret    = ["New Page"];
        $table  = "Page";

        foreach ($this->Source->find($table, ["Field" => ["id", "title"], "Where" => ["user" => $this->getParams("User")]]) as $page) {
            $ret[$page[$table]["id"]] = $page[$table]["title"];
        }

        return $ret;
    }

    public function getPartsType() {
        $ret    = [];
        $table  = "PartsType";

        foreach ($this->Source->find($table, ["Field" => ["id", "name"]]) as $type) {
            $ret[$type[$table]["id"]] = $type[$table]["name"];
        }

        return $ret;
    }

    public function getImageIds() {
        $ret    = ["Not use"];
        $table  = "Image";

        foreach ($this->Source->find($table, ["Field" => ["id", "name"], "Where" => ["user" => $this->getParams("User")]]) as $image) {
            $ret[$image[$table]["id"]] = $image[$table]["name"];
        }

        return $ret;
    }

    public function getChoiceType() {
        return ["checkbox", "selectbox", "radio button"];
    }

    public function getInputType() {
        return ["text", "number", "multiline text", "hidden"];
    }

    public function getMethodType() {
        return ["GET", "POST"];
    }

    public function getBlockTagType() {
        return ["div", "navi", "list", "list item"];
    }
}
