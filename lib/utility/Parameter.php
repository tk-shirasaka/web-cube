<?php
App::Uses("Model", "Master");

class Parameter extends Common {

    public function getParams($params = []) {
        if (is_string($params)) $params = [$params];
        $ret    = [];

        foreach ($this->Params as $key => $val) {
            if (!empty($params) and array_search($key, $params) === false) continue;
            if ($val["Attr"]) $this->_params[$key] = $_SERVER[$val["Attr"]];
            if (!$val["Normal"]) {
                switch ($key) {
                case "SSL" :
                    $this->_params[$key]    = (strpos($this->_params[$key], "https") !== false);
                    break;
                case "Query" :
                    parse_str($this->_params[$key], $this->_params[$key]);
                    break;
                case "Path" :
                    $this->_params[$key]    = (strlen($_SERVER["QUERY_STRING"])) ? substr(str_replace($_SERVER["QUERY_STRING"], "", $this->_params[$key]), 0, -1): $this->_params[$key];
                    $this->_params[$key]    = explode("/", $this->_params[$key]);
                    array_shift($this->_params["Path"]);
                    break;
                case "Locale" :
                    $this->_params[$key]    = Core::Get()->getConfig("Configure.Locale");
                    break;
                case "User" :
                    $this->_params[$key]    = $this->_getUser();
                    break;
                }
            }
            $ret[$key]  = $this->_params[$key];
        }

        if (empty($params)) Core::Get()->setPropaty(["params" => $this->_params]);

        return $ret;
    }

    private function _getUser() {
        $ret        = null;
        $table      = "User";
        $params     = ["Host"];

        if (Core::Get()->getConfig("Configure.MultiUser")) $params += ["Path"];
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
