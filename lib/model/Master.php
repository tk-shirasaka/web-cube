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

    private function _getChild($parent) {
        $parts  = $parent["Parts"]["id"];
        $sort   = ["row", "offset"];
        $ret    = $this->Source->find("Parts", ["Where" => ["parent" => $parts], "Sort" => $sort]);

        if ($ret) {
            foreach ($ret as $key => $parent) {
                $table  = $parent["Parts"]["type"]. "Parts";
                $child  = $this->_getChild($parent);
                $attr   = $this->Source->find($table, ["Where" => ["id" => $parent["Parts"]["id"]]]);
                if ($child) $ret[$key]["Child"] = $child;
                if ($attr) $ret[$key]["Attr"] = $attr[0][$table];
            }
        }
        return $ret;
    }

    public function getPage($conditions = []) {
        $table  = ["Page", "Parts"];
        $sort   = ["row", "offset"];
        $where  = [
            "path"      => implode("/", $this->_params["Path"]),
            "user"      => $this->_params["User"],
        ];

        if ($conditions) {
            $where  = isset($conditions["Where"]) ? $conditions["Where"] : $where;
        } else if ($this->_params["Method"] === "POST" and isset($this->_params["Data"]["PageId"])) {
            $where  = ["id" => $this->_params["Data"]["PageId"]];
        }

        $ret    = $this->Source->find($table, ["Where" => $where, "Sort" => $sort]);
        if (empty($ret) and $this->_params["User"] === "System") {
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
                $table  = $parent["Parts"]["type"]. "Parts";
                $child  = $this->_getChild($parent);
                $where  = ["id" => $parent["Parts"]["id"]];
                $attr   = $this->Source->find($table, ["Where" => $where]);
                if ($child) $ret[$key]["Child"] = $child;
                if ($attr) $ret[$key]["Attr"] = $attr[0][$table];
            }
        }
        Core::Get()->setPropaty(["page" => $ret]);

        return $ret;
    }

    public function getColRange() {
        return range(0, 12);
    }

    public function getOffsetRange() {
        return range(0, 11);
    }

    public function getPartsType() {
        $ret    = [];
        $table  = "PartsType";

        foreach ($this->Source->find($table, ["Field" => ["id", "name"]]) as $type) {
            $ret[$type[$table]["id"]] = $type[$table]["name"];
        }

        return $ret;
    }
}
