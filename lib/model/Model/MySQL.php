<?php
App::Uses("Model", "Database");

class MySQL extends Database {
    public  $eoq            = ";";
    public  $separator      = "__";
    public  $connect        = null;
    public  $error          = ["connect" => "connect_error", "execute" => "error"];

    protected function _connect() {
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

    protected function _begin() {
        if ($this->is_update and $this->connect) {
            $this->connect->begin_transaction();
        }
    }

    protected function _execute($query) {
        $result = $this->connect->query($query);
        $ret    = $this->is_update ? $result : [];
        if ($result and !$this->is_update) {
            while ($ret[] = $result->fetch_assoc()) {}
            array_pop($ret);
            $result->free();
        }
        return $ret;
    }

    protected function _commit($result) {
        if ($this->is_update and $this->connect) {
            if ($result)    $this->connect->commit();
            else            $this->connect->rollback();
        }
    }

    protected function _close() {
        $this->connect->close();
        $this->is_update = false;
    }
}
