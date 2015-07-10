<?php

abstract class Database extends Common {
    public  $source_type    = "Database";
    public  $config         = null;
    public  $schema         = [];
    public  $eoq            = "";
    public  $separator      = ".";
    public  $is_update      = false;
    private $_debug_level   = null;

    abstract protected function _connect();
    abstract protected function _begin();
    abstract protected function _execute($query);
    abstract protected function _commit($result);
    abstract protected function _close();

    private final function _init() {
        if (__CLASS__ !== $this->getName() and !$this->_debug_level) {
            $this->_debug_level = Core::Get()->getConfig("Configure.Debug");
        }
    }

    public function init() {
        $this->_init();
    }

    public function setConfig(&$object) {
        $this->config   = $object->config;
        if (!$object->Schema) {
            $file_path  = $object->getSubDir(). DS. "Schema.json";
            $schema     = $this->_getSchema();
            file_put_contents($file_path, json_encode($schema));
            $object->Schema = $schema;
        }
        $this->schema   = $object->Schema;
    }

    public function dumpQuery($result, $query, $time) {
        if ($this->_debug_level) {
            $class  = ($result) ? "success" : "danger";
            Core::Get()->setPropaty(["query" => compact("query", "class", "time")], true);
        }
    }

    private function _getSchema() {
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

    private function _getFields($tables, $fields = []) {
        $ret = [];
        if (!is_array($tables)) $tables = [$tables];

        foreach ($tables as $table) {
            if (empty($this->schema[$table])) continue;
            foreach (array_search_key("Field", $this->schema[$table]) as $field) {
                $cnv_field  = (count($tables) === 1) ? $field : "{$table}.{$field}";
                $flg        = ($fields and array_search("{$table}.{$field}", $fields) === false);
                if ($flg) $flg = ($fields and array_search($cnv_field, $fields) === false);
                if ($flg) continue;
                $ret[]      = "{$cnv_field} AS {$table}{$this->separator}{$field}";
            }
        }
        return (empty($ret)) ? "" : implode(", ", $ret);
    }

    private function _getQuery($type, $uses = [], $options = []) {
        $options    = (is_array($options)) ? $options : [$options];
        $format = $this->_getFormat($type, $uses);
        return ($options) ? vsprintf($format, $options) : $format;
    }

    private function _getFormat($type, $uses = []) {
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

    private function _getConditions($table, $conditions) {
        $options    = [];
        $uses       = [];
        foreach (array_keys($this->Format["Uses"]["Query"]) as $key) {
            if (isset($conditions[$key])) {
                switch ($key) {
                case "Where" :
                    $join       = $this->_getJoin($table);
                    $where      = $this->_getWhere($conditions[$key]);
                    $options[]  = ($join and $where) ? "{$join} AND {$where}" : "{$join}{$where}";
                    break;
                case "Sort" :
                    $options[]  = $this->_getSort($conditions[$key]);
                    break;
                default :
                    $options[]  = $conditions[$key];
                }
                $uses[]     = $key;
            }
        }
        return compact("options", "uses");
    }

    private function _getJoin($table) {
        $comp   = [];
        $ret    = [];

        if (is_array($table)) {
            foreach ($table as $base_table) {
                if (array_search($base_table, $comp) !== false) continue;
                $foreigns   = array_search_key(["Foreign", "Field"], $this->schema[$base_table]);
                foreach ($foreigns["Foreign"] as $key => $val) {
                    if (!$val) continue;
                    $ref_table  = $val["Table"];
                    $ref_field  = $val["Field"];
                    $base_field = $foreigns["Field"][$key];

                    if (array_search($ref_table, $table) !== false and $base_table !== $ref_table) {
                        $ret[]  = "{$base_table}.{$base_field} = {$ref_table}.{$ref_field}";
                        $comp[] = $ref_table;
                    }
                }
            }
        }

        return ($ret) ? implode(" AND ", $ret) : "";
    }

    private function _getSort($sort) {
        $sort   = (is_array($sort)) ? ["ASC" => $sort] : $sort;
        $ret    = [];

        foreach ($sort as $key => $val) {
            if ($key === "ASC" or $key === "DESC") {
                $val    = (is_array($val)) ? implode(", ", $val) : $val;
                $ret[]  = "{$val} {$key}";
            } else {
                $ret[]  = "{$val} ASC";
            }
        }

        return implode(", ", $ret);
    }

    private function _getWhere($where, $join = "AND") {
        $where  = (is_array($where)) ? $where : [$where];
        $ret    = [];

        foreach ($where as $key => $val) {
            if ($key === "And" or $key === "Or") {
                $ret        = $this->_getWhere($val, strtoupper($key));
            } else if (isset($val["Relation"]) and isset($val["Value"])) {
                $relation   = $val["Relation"];
                $value      = $val["Value"];
                $ret[]      = "{$key} {$relation} {$value}"; 
            } else if (is_array($val)) {
                $ret[]      = $this->_getWhere($val);
            } else {
                if (is_string($val)) $val = "'$val'";
                $ret[]      = "{$key} = {$val}"; 
            }
        }
        return implode(" {$join} ", $ret);
    }

    private function _cast($type, $val) {
        switch ($type) {
        case "tinyint" :
        case "smallint" :
        case "int" :
        case "bigint" :
            $val    = (int) $val;
            break;
        case "char" :
        case "varchar" :
        default :
            $val    = (string) $val;
            break;
        }
        return $val;
    }

    public function chkValid($table, $data) {
        return $this->Validation->getValidation($data, $this->Schema[$table]);
    }

    public function execute($query) {
        $start  = microtime(true);

        $this->_connect();
        $this->_begin();
        $ret    = $this->_execute($query);

        $this->_commit($ret);
        $this->_close();

        $end    = microtime(true);
        $time   = $end - $start;
        $this->dumpQuery($ret, $query, $time);

        return $ret;
    }

    public function create($table) {
        $this->is_update    = true;
        $query              = [];
        $keys               = ["Primary" => [], "Foreign" => [], "Unique" => []];

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
            if (!isset($field["Default"])) {
                array_pop($type);
            } else if (is_string($field["Default"])) {
                $options[] = "'". $field["Default"]. "'";
            } else {
                $options[] = $field["Default"];
            }
            $query[]    = $this->_getQuery("Column", $type, $options);
        }
        if ($keys["Primary"])   $query[] = $this->_getQuery("Constraints", "Primary", implode(", ", $keys["Primary"]));
        if ($keys["Unique"])    $query[] = $this->_getQuery("Constraints", "Unique", implode(", ", $keys["Unique"]));
        foreach ($keys["Foreign"] as $val) {
            $query[]    = $this->_getQuery("Constraints", "Foreign", [$val["Field"], $val["Referer"]["Table"], $val["Referer"]["Field"]]);
        }

        return $this->execute($this->_getQuery("Create", "", [$table, implode(", ", $query)]));
    }

    public function drop($table) {
        $flg = false;

        foreach ($this->show("Table") as $saved_table) {
            $saved_table    = array_values($saved_table)[0];
            if ($table !== $saved_table) continue;
            $flg                = true;
            $this->is_update    = true;
            break;
        }
        return ($flg) ? $this->execute($this->_getQuery("Drop", "", $table)) : $flg;
    }

    public function save($table, $data, $conditions = []) {
        $validation = $this->chkValid($table, $data);
        $fields     = array_search_key("Field", $this->Schema[$table]);
        $insert     = [];
        $update     = [];
        foreach ($data as $key => $val) {
            $index  = array_search($key, $fields);
            $val    = $this->_cast($this->Schema[$table][$index]["Type"], $val);
            if ($index !== false and $this->Schema[$table][$index]["Primary"]) $conditions += [$key => $val];
            if (is_string($val)) $val = "\"{$val}\"";
            $insert[$key]   = $val;
            $update[]       = "{$key} = {$val}";
        }
        if (!$validation and  is_array($data)) {
            $insert_query       = $this->_getQuery("Insert", "", [$table, implode(", ", array_keys($insert)), implode(", ", $insert)]);
            if ($conditions) {
                $conditions     = ["Where" => $conditions];
                $converted      = $this->_getConditions($table, $conditions);
                $update_query   = $this->_getQuery("Update", $converted["uses"], array_merge([$table, implode(", ", $update)], $converted["options"]));

                $query = (empty($this->find($table, $conditions))) ? $insert_query : $update_query;
            } else {
                $query = $insert_query;
            }
            $this->is_update    = true;
            $this->execute($query);
        }
        return ($validation) ? $validation : $this->_lastId();
    }

    public function delete($table, $conditions) {
        if (empty($conditions)) return;
        $conditions = ["Where" => $conditions];
        $converted  = $this->_getConditions($table, $conditions);

        if (empty($this->find($table, $conditions))) return;
        return $this->execute($this->_getQuery("Delete", $converted["uses"], array_merge([$table], $converted["options"])));
    }

    public function show($type, $options = []) {
        return $this->execute($this->_getQuery("Show", $type, $options));
    }

    public function find($table, $conditions = [], $type = "all") {
        if ($type === "first") $conditions["Limit"] = 1;
        $ret        = [];
        $options    = [];
        $options[]  = (empty($conditions["Field"])) ? $this->_getFields($table) : $this->_getFields($table, $conditions["Field"]);
        $options[]  = is_array($table) ? implode(", ", $table) : $table;
        $converted  = $this->_getConditions($table, $conditions);
        $result     = $this->execute($this->_getQuery("Select", $converted["uses"], array_merge($options, $converted["options"])));

        foreach ($result as $record) {
            $ret_record = [];
            foreach ($record as $key => $val) {
                list($table, $field)        = explode($this->separator, $key);
                $ret_record[$table][$field] = $val;
            }
            $ret[] = $ret_record;
        }
        return ($type === "first" and !empty($ret)) ? $ret[0] : $ret;
    }
}
