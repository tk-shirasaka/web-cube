<?php
App::Uses("Model", "Database");

class MySQL extends Database {
    public  $allow_instance = true;
    public  $eoq            = ";";
    public  $connect        = null;
    public  $error          = ["connect" => "connect_error", "execute" => "error"];

    public function connect() {
        $path       = $this->config["Path"];
        $user       = $this->config["User"];
        $password   = $this->config["Password"];
        $database   = $this->config["Database"];
        $port       = $this->config["Port"];

        if ($port) {
            $this->connect = new mysqli($path, $user, $password, $database, $port);
        } else {
            $this->connect = new mysqli($path, $user, $password, $database);
        }
    }

    public function _execute($query) {
        $ret    = [];
        $result = $this->connect->query($query);
        if ($result) {
            while ($ret[] = $result->fetch_assoc()) {}
            array_pop($ret);
            $result->free();
        }
        return $ret;
    }
}
