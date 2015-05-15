<?php

include_once CORE. DS. "main.php";
include_once CORE. DS. "Common.php";
include_once CORE. DS. "App.php";

/**
 * Lib only path
 */
$build_option = ["lib" => true, "app" => false];
App::Build("Utility", "Utility", $build_option);

/**
 * App and Lib path
 */
$build_option = ["lib" => true];
App::Build("Config", "Config", $build_option);
App::Build("Schema", "Schema", $build_option);
App::Build("Model", "Model", $build_option);
App::Build("View", "View", $build_option);

Core::Get()->start();
