<?php
App::Uses("View", "Html");

class View extends Common {
    protected   $type   = "Html";

    public function init() {
        $this->{"View.{$this->type}"}->view();
    }
}
