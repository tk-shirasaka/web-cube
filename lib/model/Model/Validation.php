<?php
class Validation extends Common {

    private function _requre($data, $key, $value) {
        return (empty($data[$key])) ? ["requre" => "Require Field"] : [];
    }

    private function _max($data, $key, $max) {
        if (!isset($data[$key])) return [];
        if ($data[$key] <= $max) return [];
        return ["max" => "Max number is {$max}"];
    }

    private function _min($data, $key, $min) {
        if (!isset($data[$key])) return [];
        if ($data[$key] >= $min) return [];
        return ["min" => "Min number is {$min}"];
    }

    private function _maxLength($data, $key, $maxLength) {
        if (!isset($data[$key])) return [];
        if (strlen($data[$key]) <= $maxLength) return [];
        return ["maxLength" => "Max length is {$maxLength} bytes"];
    }

    private function _format($data, $key, $formats) {
        if (!isset($data[$key])) return [];
        if (!is_array($formats)) $formats = [$formats]; 

        foreach ($formats as $format) {
            if (preg_match("/{$format}/", $data[$key])) return [];
        }
        return ["format" => "Follow this format : {$format}"];
    }

    private function _numeric($bytes, $sign = true) {
        $max    = pow(2, 8 * $bytes - (($sign) ? 1 : 0)) - 1;
        $min    = ($sign) ? -1 - $max : 0;

        return compact("max", "min");
    }

    public function getValidation($data, $schema) {
        $ret    = [];
        foreach ($schema as $field) {
            $valid  = [];
            $error  = [];
            $name   = $field["Field"];
            $type   = $field["Type"];
            $length = $field["Length"];

            if (!(isset($field["Default"]) or $field["Null"] or $field["Primary"])) $valid["requre"] = true;
            switch ($type) {
            case "int" :
                $bytes  = ["smallint" => 2, "int" => 4, "bigint" => 8];
                $valid += $this->_numeric($bytes[$type]);
                break;
            case "tinyint" :
                $valid += $this->_numeric(1, false);
                break;
            case "char" :
            case "varchar" :
                $valid += ["maxLength" => $length];
                break;
            case "date" :
            case "datetime" :
                $dlm    = ["/", "-", "@"];
                $format = "\d{4}{DLM}\d{2}{DLM}\d{2}";
                if ($type === "datetime")       $format            .= " \d{2}:\d{2}:\d{2}";
                if (empty($valid["format"]))    $valid["format"]    = [];
                for ($i = 0; $i < count($dlm); $i++) {
                    $valid["format"][]  = str_replace("{DLM}", $dlm[$i], $format);
                }
                break;
            }

            foreach ($valid as $key => $val) {
                $error += $this->{"_{$key}"}($data, $name, $val);
            }
            if (!empty($error)) $ret[$name]   = $error;
        }

        return (empty($ret)) ? null : $ret;
    }
}
