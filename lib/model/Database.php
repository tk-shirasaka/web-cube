<?php

class Database extends Common {
    public  $allow_instance = true;
    public  $source_type    = "Database";
    public  $config         = null;
    public  $schema         = [];
    public  $eoq            = "";
    public  $isUpdate       = false;
    private $_debug_level   = null;

    private final function _init() {
        $this->Format;
        $this->Referer;
        $this->Format       = (is_array($this->Format)) ? array_merge($this->{"Model.Database"}->Format, $this->Format) : $this->{"Model.Database"}->Format;
        $this->Referer      = (is_array($this->Referer)) ? array_merge($this->{"Model.Database"}->Referer, $this->Referer) : $this->{"Model.Database"}->Referer;
        $this->_debug_level = Core::Get()->getConfig("Configure")["Debug"];
    }

    public function init() {
        if (__CLASS__ !== $this->_name and !$this->_debug_level) $this->_init();
    }

    public function setConfig(&$object) {
        $uses           = $object->uses;
        $this->config   = $object->config[$uses];
        if (!$object->{"Schema\\{$uses}"}) {
            $file_path  = $object->_sub_dir. DS. "Schema\\{$uses}.json";
            $schema     = $this->getSchema();
            file_put_contents($file_path, json_encode($schema));
            $object->{"Schema\\{$uses}"} = $schema;
        }
        $this->schema   = $object->{"Schema\\{$uses}"};
    }

    public function dumpQuery($query, $time) {
        if ($this->_debug_level) echo "{$query} : {$time}</br>";
    }

    public function getQuery($type, $uses = [], $options = []) {
        $options    = (is_array($options)) ? $options : [$options];
        $format = $this->getFormat($type, $uses);
        return ($options) ? vsprintf($format, $options) : $format;
    }

    public function getFormat($type, $uses = []) {
        $is_sql     = (isset($this->Format[$type]["SQL"]));
        $formats    = ($is_sql) ? $this->Format[$type]["SQL"] : $this->Format["Uses"][$type];
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

        return ($is_sql) ? "{$format}{$this->eoq}" : $format;
    }

    public function getJoin($table) {
        $comp = [];

        if (is_array($table)) {
            foreach ($table as $base_table) {
                if (array_search($base_table, $comp) !== false) continue;
                $foreigns   = array_search_key(["Foreign", "Field"], $this->schema[$base_table]);
                foreach ($foreigns["Foreign"] as $key => $val) {
                    if (!$val) continue;
                    $ref_table  = $val["Table"];
                    $ref_field  = $val["Field"];
                    $base_field = $foreigns["Field"][$key];

                    if (array_search($ref_table, $table) !== false) {
                        $ret[]  = "{$base_table}.{$base_field} = {$ref_table}.{$ref_field}";
                        $comp[] = $ref_table;
                    }
                }
            }
        }

        return implode(" AND ", $ret);
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
                if (is_string($val)) $val = "'$val'";
                $ret[]      = "{$key} = {$val}"; 
            }
        }
        return implode(" {$join} ", $ret);
    }

    public function close() {
        $this->connect->close();
        $this->isUpdate = false;
    }

    public function execute($query) {
        $start  = microtime(true);

        $this->connect();
        $ret    = $this->_execute($query);

        if ($this->isUpdate) $this->_commit();
        $this->close();

        $end    = microtime(true);
        $time   = $end - $start;
        $this->dumpQuery($query, $time);

        return $ret;
    }

    public function create($table) {
        $query  = [];
        $keys   = ["Primary" => [], "Foreign" => [], "Unique" => []];
        foreach ($this->schema[$table] as $field) {
            $type       = ["Type"];
            $options    = [$field["Field"], $field["Type"]];
            if ($field["Length"]) {
                $type[]     = "Length";
                $options[]  = $field["Length"];
            }
            if (!$field["Null"]) {
                $type[]     = "Null";
            }
            if ($field["Primary"])  $keys["Primary"][]  = $field["Field"];
            if ($field["Unique"])   $keys["Unique"][]   = $field["Field"];
            if ($field["Foreign"])  $keys["Foreign"][]  = ["Field" => $field["Field"], "Referer" => $field["Foreign"]];

            $type[]     = "Default";
            if ($field["Default"] === "") {
                array_pop($type);
            } else if (is_string($field["Default"]) and $field["Default"] !== "NULL") {
                $options[] = "'". $field["Default"]. "'";
            } else if ($field["Default"] !== ""){
                $options[] = $field["Default"];
            }
            $query[]    = $this->getQuery("Column", $type, $options);
        }
        if ($keys["Primary"])   $query[] = $this->getQuery("Constraints", "Primary", implode(", ", $keys["Primary"]));
        if ($keys["Unique"])    $query[] = $this->getQuery("Constraints", "Unique", implode(", ", $keys["Unique"]));
        foreach ($keys["Foreign"] as $val) {
            $query[]    = $this->getQuery("Constraints", "Foreign", [$val["Field"], $val["Referer"]["Table"], $val["Referer"]["Field"]]);
        }

        return $this->execute($this->getQuery("Create", "", [$table, implode(", ", $query)]));
    }

    public function drop($table) {
        $flg = false;
        foreach ($this->show("Table") as $saved_table) {
            $saved_table    = array_values($saved_table)[0];
            if ($table !== $saved_table) continue;
            $flg    = true;
            break;
        }
        return ($flg) ? $this->execute($this->getQuery("Drop", "", $table)) : $flg;
    }

    public function show($type, $options = []) {
        return $this->execute($this->getQuery("Show", $type, $options));
    }

    public function find($table, $conditions = []) {
        $ret        = [];
        $uses       = [];
        $options    = [];
        $options[]  = (empty($conditions["Field"])) ? "*" : implode(" ,", $conditions["Field"]);
        $options[]  = is_array($table) ? implode(", ", $table) : $table;

        foreach (array_keys($this->Format["Uses"]["Query"]) as $key) {
            if (isset($conditions[$key])) {
                if ($key === "Where") {
                    $join       = $this->getJoin($table);
                    $where      = $this->getWhere($conditions[$key]);
                    $options[]  = ($join and $where) ? "{$join} AND {$where}" : "{$join}{$where}";
                } else {
                    $options[]  = $conditions[$key];
                }
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
