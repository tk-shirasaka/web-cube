<?php
class View extends Common {
    protected   $type           = "Html";
    protected   $auto_render    = true;
    protected   $layout         = "Layout";

    final public function init() {
        $class      = $this->getView("Class");
        $action     = $this->getView("Action");
        $args       = $this->getView("Args");
        $renderd    = false;

        if (!$args) $args = [];
        if (__CLASS__ === $this->getName()) {
            App::Uses("View", $this->type);
            App::Uses("View", $class);
 
            if (is_object($this->{"View.{$class}"})) $renderd = true;
        }

        if (!$renderd) {
            $this->Viewer   = $this->{"View.{$this->type}"};

            if (method_exists($this, "beforeRender"))   $this->beforeRender();
            if (method_exists($this, $action))          call_user_func_array([$this, $action], $args);
            if ($this->auto_render)                     $this->Viewer->view($this->layout);
            if (method_exists($this, "afterRender"))    $this->afterRender();
        }
    }
}
