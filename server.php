<?php
		error_reporting(E_ALL);
		ini_set('display_errors',true);
		session_start();
		require 'config.php';
		require 'Pg.php';
		require 'PgException.php';
		require 'PgCheckObject.php';

		$action=$_GET['action'];
		$params=$_POST??[];
		$pg=new Pg();
		try{
			$pg->connect(in_array($action,['getRoles','setRole'])?'postgres':($_SESSION['role']??'postgres'));
			
			$info=PgCheckObject::create($pg)->checkObject($action);
			switch($action){
			case 'getRoles':
				$data = array_map(
					function($r){return $r->usename;},
					$pg->query("select usename from pg_user order by 1",[],false)
				);
			break;
			case 'setRole':
				$_SESSION['role']=$params['role'];
			break;
			case 'getAuthors':
				$data = $pg->query("select * from authors_v",[]);
			break;
			case 'addAuthor':
				$data = $pg->execFunction("add_author",$_POST);
			break;
			case 'getBooks':
				$data = $pg->query("select * from catalog_v",[]);
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
			case 'orderBook':
				$data = $pg->query("update catalog_v set onhand_qty = onhand_qty + $1 where book_id = $2",[$_POST['qty'],$_POST['id']]);
			break;
			case 'findBooks':
				$_POST['author_name']=trim($_POST['author_name'])===''?null:$_POST['author_name'];
				$_POST['book_title']=trim($_POST['book_title'])===''?null:$_POST['book_title'];
				$_POST['in_stock']=array_key_exists('in_stock',$_POST);
				$data = $pg->execFunction("get_catalog",$_POST);
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
			$pg->close();
		}
		
		header('content-type:application/json');
		echo json_encode([
			'data'=>$data??null,
			'sql'=>$pg->sql,
			'err'=>$err??null,
			'notice'=>$pg->notice??null,
			'info'=>$info??null
		]);
?>
