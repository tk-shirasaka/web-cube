<?php

/**
 * Application Path
 */
define("ROOT",      dirname(dirname(dirname(__FILE__))));

define("LIB",       ROOT. DS. "lib");
define("CORE",      LIB. DS. "core");

define("APP",       ROOT. DS. "App");
define("CONFIG",    ROOT. DS. "Config");
define("SCHEMA",    ROOT. DS. "Schema");
define("VIEW",      APP. DS. "View");
define("MODEL",     APP. DS. "Model");
define("WWW_ROOT",  APP. DS. "webroot");

/**
 * System default user
 */
define("SYS_USER",  "sysadmin");
