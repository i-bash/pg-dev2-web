<?php
		//config error processing and reporting
		error_reporting(E_ALL);
		ini_set('display_errors',true);
		set_error_handler(
			function ($errlevel,$errmessage,$errfile,$errline,$errcontext=null,$trace=null){
				if($errlevel&error_reporting()){
					throw new ErrorException($errmessage,E_USER_ERROR,1,$errfile,$errline);
				}
				else{
					return;
				}
			}
		);
		session_start();
		require 'Pg.php';
		require 'PgException.php';

		$pg=new Pg();
		$action=$_GET['action']??'';
		$params=$_POST??[];
		$trace=in_array(($_GET['trace']??''),['y','yes','t','true','1']);
		try{
			$pg->connect($_GET['connectString']??'');
			$objectInfo=null;
			$pg->begin();
			if($trace){
				$pg->execFunction("trace");
			}
			switch($action){
			// shop
			case 'register':
				$data = $pg->execFunction("webapi.register_user",$_POST);
			break;
			case 'login':
				$data = $pg->execFunction("webapi.login",$_POST);
			break;
			case 'logout':
				$data = $pg->execFunction("webapi.logout",$_POST);
			break;
			case 'findBooks':
				$data = $pg->execFunctionJson("webapi.get_catalog",$_POST);
			break;
			case 'getImage':
				$data = $pg->execFunction("webapi.get_image",$_GET);
			break;
			case 'vote':
				$data = $pg->execFunction("webapi.cast_vote",$_POST);
			break;
			case 'toCart':
				$data = $pg->execFunction("webapi.add_to_cart",$_POST);
			break;
			case 'getCart':
				$data = $pg->execFunctionJson("webapi.get_cart",$_POST);
			break;
			case 'fromCart':
				$data = $pg->execFunction("webapi.remove_from_cart",$_POST);
			break;
			case 'checkout':
				$data = $pg->execFunction("webapi.checkout",$_POST);
			break;
			// admin
			case 'getBooks':
				$data = $pg->execFunction("empapi.get_catalog",$_POST);
			break;
			case 'getTasks':
				$data = $pg->execFunction("empapi.get_tasks",$_POST);
			break;
			case 'getPrograms':
				$data = $pg->execFunction("empapi.get_programs",$_POST);
			break;
			case 'orderBook':
				$data = $pg->execFunction("empapi.receipt",$_POST);
			break;
			case 'runTask':
				$data = $pg->execFunction("empapi.run_program",$_POST);
			break;
			case 'taskResults':
				$data = $pg->execFunction("empapi.task_results",$_POST);
			break;
			case 'setPrice':
				$data = $pg->execFunction("empapi.set_retail_price",$_POST);
			break;

			///

			case 'getAuthors':
				$data = $pg->query("select * from authors_v",[]);
			break;
			case 'addAuthor':
				$data = $pg->execFunction("add_author",$_POST);
			break;
			case 'getOperations':
				$data = $pg->query("select * from operations_v where book_id = $1",[$params['book_id']]);
			break;
			case 'addBook':
				$data = $pg->execFunction(
					"add_book",
					[
						'title'=>$_POST['title'],
						'authors'=>'{'.implode(',',$_POST['authors']).'}'
					]
				);
			break;
			case 'buyBook':
				$data=$pg->execFunction("buy_book",$_POST);
				break;
			default:
				throw new RuntimeException('Internal error. Unknown server action: '.$action);
			}
		}
		catch(Exception $e){
			$err=new stdClass();
			$err->code = $e->getCode();
			$err->message = $e->getMessage();
		}
		finally{
			try{
				if($pg->isConnected()){
					$pg->end();
					$pg->close();
				}
			}
			catch(Exception $e){}
		}
		header('content-type:application/json');
		echo json_encode([
			'data'=>$data??null,
			'conninfo'=>$pg->info,
			'sql'=>$pg->sql,
			'err'=>$err??null,
			'notices'=>$pg->notices??null
		]);
?>
