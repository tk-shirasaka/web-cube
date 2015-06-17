<?php
App::Uses("View", "Html");

class View extends Common {
    protected   $type           = "Html";
    protected   $auto_render    = true;
    protected   $layout         = "Layout";

    final public function init() {
        $path   = explode("/", $this->_page[0]["Page"]["path"]);
        $action = (count($path) < 2) ? "" : $path[1];
        array_shift($path);
        array_shift($path);
        if (method_exists($this, "beforeRender"))   $this->beforeRender();
        if (method_exists($this, $action))          call_user_func_array([$this, $action], $path);
        if ($this->auto_render)                     $this->{"View.{$this->type}"}->view($this->layout);
        if (method_exists($this, "afterRender"))    $this->afterRender();
    }
}
