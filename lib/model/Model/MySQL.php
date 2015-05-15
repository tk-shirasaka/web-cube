<?php
App::Uses("Model", "Database");

class MySQL extends Database {
    public  $allow_instance = true;
    public  $eoq            = ";";
    public  $connect        = null;
    public  $error          = ["connect" => "connect_error", "execute" => "error"];

    public function connect() {
        $path       = $this->_config["path"];
        $user       = $this->_config["User"];
        $password   = $this->_config["Password"];
        $database   = $this->_config["Database"];
        $port       = $this->_config["Port"];

        if ($port) {
            $this->connect = new mysqli($server, $user, $password, $database, $port);
        } else {
            $this->connect = new mysqli($server, $user, $password, $database);
        }
    }
}
