<?php
App::Uses("Model", "Master");

class Parameter extends Common {

    public function getParams($params = []) {
        if (is_string($params)) $params = [$params];
        $ret        = [];
        $headers    = getallheaders();

        foreach ($this->Params as $key => $val) {
            if (!empty($params) and array_search($key, $params) === false) continue;
            if ($val["Attr"]) $ret[$key] = $_SERVER[$val["Attr"]];
            if (!$val["Normal"]) {
                switch ($key) {
                case "SSL" :
                    $ret[$key]  = (strpos($ret[$key], "https") !== false);
                    break;
                case "Query" :
                    parse_str($ret[$key], $ret[$key]);
                    break;
                case "Path" :
                    $ret[$key]  = (strlen($_SERVER["QUERY_STRING"])) ? substr(str_replace($_SERVER["QUERY_STRING"], "", $ret[$key]), 0, -1) : $ret[$key];
                    $ret[$key]  = explode("/", $ret[$key]);
                    array_shift($ret["Path"]);
                    break;
                case "Request" :
                    if (isset($headers["Content-Type"]) and strpos(strtolower($headers["Content-Type"]), "application/json") !== false) {
                        $ret[$key]  = json_decode(file_get_contents("php://input"), true);
                    } else {
                        $ret[$key]  = $_POST;
                    }
                    break;
                case "Locale" :
                    $ret[$key]  = Core::Get()->getConfig("Configure.Locale");
                    break;
                case "User" :
                    $ret[$key]  = $this->_getUser();
                    break;
                }
            }
        }

        if (empty($params)) Core::Get()->setPropaty(["params" => $ret]);

        return $ret;
    }

    private function _getUser() {
        $ret        = null;
        $table      = "User";
        $params     = ["Host"];

        if (Core::Get()->getConfig("Configure.MultiUser")) $params[] = "Path";
        $params     = $this->getParams($params);
        $params    += ["User" => SYS_USER];

        foreach ($params as $key => $val) {
            switch ($key) {
            case "Host" :
                $where  = ["domain" => $val];
                break;
            case "Path" :
                $where  = ["name" => $val[0]];
                break;
            case "User" :
                $where  = ["name" => $val];
                break;
            }
            $user   = $this->{"Model.Master"}->Source->find($table, ["Where" => $where]);

            if (empty($user)) continue;
            $ret    = $user[0][$table]["id"];
        }
        return $ret;
    }
}
