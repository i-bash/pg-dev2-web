<?php
    error_reporting(E_ALL);
    ini_set('display_errors',true);
    require 'config.php';
    require 'lib/db.php';
    require 'shapes/index.php';
    
    $pg=new PG();
    echo $pg->execFunction('currency.rate',['rub','usd','2017-01-24']);
?>