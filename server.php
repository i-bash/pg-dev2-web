<?php
    error_reporting(E_ALL);
    ini_set('display_errors',true);
    session_start();
    require 'config.php';
    require 'db.php';
    
    $params=$_POST??[];
    $pg=new PG();
    try{
			$pg->connect();
			
			switch($_GET['action']){
			case 'getRoles':
				$data = array_map(
					function($r){return $r->rolname;},
					$pg->query("select rolname from pg_roles order by 1")
				);
			break;
			case 'setRole':
				$_SESSION['role']=$params['role'];
			break;
			case 'getAuthors':
				$data = $pg->query("select * from authors_v");
			break;
			case 'getBooks':
				$data=$pg->query("select * from books");
			break;
			default:
				
			}
		}
		catch(PDOException $e){
			if(strstr($e->getMessage(), 'SQLSTATE[')) {
				preg_match('/SQLSTATE\[(\w+)\](.*)/', $e->getMessage(), $matches);
				$err=new stdClass();
				$err->code = $matches[1];
				$err->message = $matches[2];
			}
		}
		header('content-type:application/json');
		echo json_encode([
			'data'=>$data??null,
			'sql'=>$pg->sql,
			'err'=>$err??null
		]);
/*
    echo $pg->execFunction('currency.rate',['rub','usd','2017-01-01']);
    echo '<br/>';
    echo $pg->execFunction('currency.rate',['rub','usd','2017-01-11']);
    echo '<br/>';
    echo $pg->execFunction('currency.rate',['rub','usd','2017-01-21']);
*/

?>
