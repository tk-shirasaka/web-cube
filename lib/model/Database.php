<?php

class Database extends Common {
    public  $allow_instance = true;
    public  $source_type    = "Database";
    public  $config        = null;
    public  $eoq            = "";
    public  $isUpdate       = false;
    private $_init          = false;

    private final function _init() {
        $this->_init    = true;
        $this->Format;
        $this->Referer;
        $this->Format   = (is_array($this->Format)) ? array_merge($this->{"Model.Database"}->Format, $this->Format) : $this->{"Model.Database"}->Format;
        $this->Referer  = (is_array($this->Referer)) ? array_merge($this->{"Model.Database"}->Referer, $this->Referer) : $this->{"Model.Database"}->Referer;
    }

    public function init() {
        if (__CLASS__ !== $this->_name and !$this->_init) $this->_init();
    }

    public function setConfig($config) {
        $this->config  = $config;
    }

    public function getQuery($type, $uses = [], $options = []) {
        $options    = (is_array($options)) ? $options : [$options];
        $format = $this->getFormat($type, $uses);
        return ($options) ? vsprintf($format, $options) : $format;
    }

    public function getFormat($type, $uses = []) {
        $formats    = $this->Format[$type]["SQL"];
        $uses       = (is_array($uses)) ? $uses : [$uses];
        $format     = (isset($formats["Normal"])) ? $formats["Normal"] : "";

        if (isset($this->Format[$type]["Uses"])) {
            foreach ($this->Format[$type]["Uses"] as $use) {
                $formats += $this->Format["Uses"][$use];
            }
        }
        foreach ($uses as $use) {
            if ($format) $format .= " ";
            $format .= (isset($formats[$use])) ? $formats[$use] : "";
        }

        return $format. $this->eoq;
    }

    public function getWhere($where, $join = "AND") {
        $where  = (is_array($where)) ? $where : [$where];
        $ret    = [];

        foreach ($where as $key => $val) {
            if ($key === "And" or $key === "Or") {
                $ret        = $this->getWhere($val, strtoupper($key));
            } else if (isset($val["Relation"]) and isset($val["Value"])) {
                $relation   = $val["Relation"];
                $value      = $val["Value"];
                $ret[]      = "{$key} {$relation} {$value}"; 
            } else if (is_array($val)) {
                $ret[]      = $this->getWhere($val);
            } else {
                $ret[]      = "{$key} {$relation} {$val}"; 
            }
        }
        return implode(" {$join} ", $ret);
    }

    public function close() {
        $this->connect->close();
        $this->isUpdate = false;
    }

    public function execute($query) {
        $this->connect();
        $ret    = $this->_execute($query);

        if ($this->isUpdate) $this->_commit();
        $this->close();

        return $ret;
    }

    public function show($type, $options = []) {
        return $this->execute($this->getQuery("Show", $type, $options));
    }

    public function find($table, $conditions = []) {
        $ret        = [];
        $uses       = [];
        $options    = [];
        $options[]  = (empty($conditions["Field"])) ? "*" : implode(" ,", $conditions["Field"]);
        $options[]  = $table;

        foreach (array_keys($this->Format["Uses"]["Query"]) as $key) {
            if (isset($conditions[$key])) {
                $options[]  = ($key === "Where") ? $this->getWhere($conditions[$key]) : $conditions[$key];
                $uses[]     = $key;
            }
        }

        return $this->execute($this->getQuery("Select", $uses, $options));
    }

    public function getSchema() {
        $ret        = [];
        $ref        = ["Src" => $this->Referer["Src"], "Dst" => $this->Referer["Dst"]];
        $foreign    = array_search_key(array_merge(array_values($ref["Src"]), array_values($ref["Dst"])), $this->find($this->Referer["Table"], $this->Referer));

        foreach ($this->show("Table") as $table) {
            $table          = $table[array_keys($table)[0]];
            $columns        = $this->show("Column", $table);
            foreach ($columns as $key => $val) {
                $type                       = explode("(", $columns[$key]["Type"]);
                $type[1]                    = (count($type) > 1) ? (int) str_replace(")", "", $type[1]) : null;
                $columns[$key]["Type"]      = $type[0];
                $columns[$key]["Length"]    = $type[1];
                $columns[$key]["Null"]      = ($columns[$key]["Null"] === "YES");
                $columns[$key]["Primary"]   = ($columns[$key]["Key"] === "PRI");
                $columns[$key]["Foreign"]   = false;
                $columns[$key]["Unique"]    = ($columns[$key]["Key"] === "UNI");
                unset($columns[$key]["Key"]);
            }
            for ($i = 0; $i < count($foreign[$ref["Src"]["Table"]]); $i++) {
                $s_table    = $foreign[$ref["Src"]["Table"]][$i];
                $s_column   = $foreign[$ref["Src"]["Column"]][$i];
                $d_table    = $foreign[$ref["Dst"]["Table"]][$i];
                $d_column   = $foreign[$ref["Dst"]["Column"]][$i];

                if ($table === $s_table and ($index = array_search($s_column, array_search_key("Field", $columns)))) $columns[$index]["Foreign"] = ["Table" => $d_table, "Field" => $d_column];
            }
            $ret[$table]    = $columns;
        }
        return $ret;
    }
}
