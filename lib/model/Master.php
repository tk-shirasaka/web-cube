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

    private function _getParts($where) {
        $sort   = ["row", "offset"];
        $parts  = $this->Source->find(["Parts", "PartsType"], ["Where" => $where, "Sort" => $sort]);

        if (empty($parts)) return [];
        foreach ($parts as $key => $val) {
            $id                     = $val["Parts"]["id"];
            $table                  = $val["PartsType"]["table_name"];
            $attr                   = $this->Source->find($table, ["Where" => compact("id")], "first");
            $parts[$key]["Attr"]    = $attr[$table];
            if (isset($attr[$table]["child"])) $parts[$key]["Child"] = $this->_getParts(["parent" => $id]);
        }

        return $parts;
    }

    public function getPage($conditions = []) {
        $ret    = [];
        $id     = $this->getParams("Data.PageId");
        $user   = $this->getParams("User");
        $path   = implode("/", $this->getParams("Path"));
        $wheres = [
            ($id) ? compact("id") : null,
            compact("user", "path"),
            compact("user") + ["path" => ""],
            ["user" => "system", "path" => "Error"],
        ];

        foreach ($wheres as $where) {
            $page   = $this->Source->find("Page", ["Where" => $where], "first");
            if (empty($where) or empty($page)) continue;

            $ret    = $page;
            $where  = array_merge([
                "page"      => $page["Page"]["id"],
                "parent"    => ["Relation" => "IS", "Value" => "NULL"],
            ], $conditions);
            $ret   += $this->_getParts($where);
            break;
        }

        Core::Get()->setPropaty(["page" => $ret]);

        return $ret;
    }

    public function saveParts($parts) {
        $ret            = [];
        $id             = $parts["Parts"]["id"];
        $user           = $this->getParams("User");
        $table          = $this->Source->find("PartsType", ["Field" => ["table_name"], "Where" => ["id" => $parts["Parts"]["type"]]], "first");
        $table          = $table["PartsType"]["table_name"];
        if (!empty($parts["Child"])) $ret["Relation"] = $this->Source->save("PartsRelation", compact("id", "user"));

        $ret["Parts"]   = $this->Source->save("Parts", $parts["Parts"]);
        $ret["Attr"]    = $this->Source->save($table, $parts["Attr"]);

        return (is_array($ret["Parts"]) and is_array($ret["Attr"]) or (isset($ret["Relation"]) and is_array($ret["Relation"]))) ? [$id => $ret] : [];
    }

    public function savePage($page, $parts, $parent = null) {
        $ret            = [];

        if (!$parent) {
            if (!$page["id"]) $page["id"] = uniqid("", true);
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
        $parent         = $parts["Parts"]["parent"];
        $table          = $parts["PartsType"]["table_name"];
        $where          = ["parent" => $id];
        $ret["Attr"]    = $this->Source->delete($table, compact("id"));
        $ret["Parts"]   = $this->Source->delete("Parts", compact("id"));

        if (empty($this->Source->find("Parts", ["Where" => ["parent" => $id]]))) $ret["Relation"] = $this->Source->delete("PartsRelation", compact("id"));
        if (empty($this->Source->find("Parts", ["Where" => compact("parent")]))) $ret["Relation"] = $this->Source->delete("PartsRelation", ["id" => $parent]);

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

    public function getChoiceType() {
        return ["checkbox", "selectbox", "radio button"];
    }

    public function getInputType() {
        return ["text", "number", "multiline text", "password", "hidden"];
    }

    public function getMethodType() {
        return ["GET", "POST"];
    }

    public function getBlockTagType() {
        return ["div", "navi", "list", "list item"];
    }
}
