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

    public function getParts($where, $table = []) {
        if (is_string($table)) $table = [$table];
        $table  = array_merge(["Parts", "PartsType"], $table);
        $sort   = ["row", "offset", "title"];
        $parts  = $this->Source->find($table, ["Where" => $where, "Sort" => $sort]);

        if (empty($parts)) return [];
        foreach ($parts as $key => $val) {
            $table                  = $val["PartsType"]["table_name"];
            $attr                   = $this->Source->find($table, ["Where" => ["id" => $val["Parts"]["id"]]], "first");
            $parts[$key]["Attr"]    = $attr[$table];
            if ($val["PartsType"]["child"] and !empty($val["Parts"]["child"])) $parts[$key]["Child"] = $this->getParts(["parent" => $val["Parts"]["child"]]);
        }

        return $parts;
    }

    public function getPage($conditions = []) {
        $ret    = [];
        $id     = $this->getParams("Data.PageId");
        $user   = $this->getParams("User");
        $path   = implode("/", $this->getParams("Path"));
        $wheres = ($conditions) ? [$conditions] : [
            ($id) ? compact("id") : null,
            compact("user", "path"),
            ["user" => ["Relation" => "IS", "Value" => "NULL"]] + compact("path"),
            compact("user") + ["path" => "error"],
            ["user" => ["Relation" => "IS", "Value" => "NULL"], "path" => "error"],
        ];

        foreach ($wheres as $where) {
            $page   = $this->Source->find("Page", ["Where" => $where], "first");
            if (empty($where) or empty($page)) continue;

            $ret    = $page;
            $where  = [
                "page"      => $page["Page"]["id"],
                "parent"    => ["Relation" => "IS", "Value" => "NULL"],
            ];
            $ret   += $this->getParts($where);
            break;
        }

        Core::Get()->setPropaty(["page" => $ret]);

        return $ret;
    }

    public function savePage($page) {
        $page              += ["user" => $this->getParams("User")];
        $error              = [];
        $error["Page"]      = $this->Source->save("Page", $page);
        return ($error["Page"] === true) ? true : compact("error");
    }

    public function saveParts($parts) {
        $ret                = true;
        $error              = [];
        $parts["Parts"]    += ["user" => $this->getParams("User")];
        $parts["Attr"]      = array_merge($parts["Attr"], ["id" => $parts["Parts"]["id"]]);
        $type               = $this->Source->find("PartsType", ["Where" => ["id" => $parts["Parts"]["type"]]], "first");
        $table              = $type["PartsType"]["table_name"];
        if ($type["PartsType"]["child"] and empty($parts["Parts"]["child"]))            $parts["Parts"]["child"]    = $parts["Parts"]["id"];
        if ($type["PartsType"]["child"])                                                $error["PartsRelation"]     = $this->Source->save("PartsRelation", ["id" => $parts["Parts"]["child"]]);
        if (($error["Parts"] = $this->Source->save("Parts", $parts["Parts"])) !== true) $ret                        = false;
        if (($error["Attr"] = $this->Source->save($table, $parts["Attr"])) !== true)    $ret                        = false;
        if (!$ret) $this->removeParts($parts);
        return ($ret) ? $ret : compact("error");
    }

    public function removePage($id) {
        $ret            = [];
        if ($partsList = $this->Source->find(["Parts", "PartsType"], ["Where" => ["page" => $id]])) {
            foreach ($partsList as $parts) {
                $this->removeParts($parts);
            }
        }

        $ret = [$id => $this->Source->delete("Page", compact("id"))];
        return $ret;
    }

    public function removeParts($parts) {
        $ret            = [];
        $id             = $parts["Parts"]["id"];
        $table          = $parts["PartsType"]["table_name"];
        $ret["Attr"]    = $this->Source->delete($table, compact("id"));
        $ret["Parts"]   = $this->Source->delete("Parts", compact("id"));

        if (!empty($parts["PartsType"]["child"]) and empty($this->Source->find("Parts", ["Where" => ["child" => $parts["Parts"]["child"]]]))) {
            foreach ($parts["Child"] as $child) {
                $ret   += $this->removeParts($child);
            }
            $this->Source->delete("PartsRelation", ["id" => $parts["Parts"]["child"]]);
        }
        if (empty($this->Source->find("Parts", ["Where" => ["parent" => $parts["Parts"]["parent"]]]))) $this->Source->delete("PartsRelation", ["id" => $parts["Parts"]["parent"]]);

        return (is_array($ret["Parts"]) and is_array($ret["Attr"]) or (isset($ret["Relation"]) and is_array($ret["Relation"]))) ? [$id => $ret] : [];
    }
}
