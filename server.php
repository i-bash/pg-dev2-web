<?php
    error_reporting(E_ALL);
    ini_set('display_errors',true);
    session_start();
    require 'config.php';
    require 'Pg.php';
    require 'PgObjectMissingException.php';
    
    $action=$_GET['action'];
    $params=$_POST??[];
    $pg=new Pg();
    try{
			$pg->connect(in_array($action,['getRoles','setRole'])?'postgres':($_SESSION['role']??'postgres'));

			switch($action){
			case 'getRoles':
				$data = array_map(
					function($r){return $r->rolname;},
					$pg->query("select rolname from pg_roles order by 1",[],null,null,false)
				);
			break;
			case 'setRole':
				$_SESSION['role']=$params['role'];
			break;
			case 'getAuthors':
				$data = $pg->query("select * from authors_v",[],'view','authors_v');
			break;
			case 'addAuthor':
				$data = $pg->execFunction("add_author",$_POST);
			break;
			case 'getBooks':
				$data = $pg->query("select * from catalog_v",[],'view','catalog_v');
			break;
			case 'addBook':
				$pg->query("begin");
				try{
					$res = $pg->execFunction("add_book",['title'=>$_POST['title']]);
					foreach($_POST['authors'] as $i=>$a){
						$pg->execFunction("add_authorship",["book_id"=>$res[0]['result'],"author_id"=>$a,"seq_num"=>$i+1]);
					}
					$pg->query("commit");
					$data="ok";
				}
				catch(Exception $e){
					$pg->query("rollback");
					throw $e;
				}
			break;
			case 'addAuthorship':
				$data = $pg->execFunction("add_authorship",$_POST);
			break;
			case 'getCatalog':
				$data = $pg->query("select * from catalog_v",[],'view','catalog_v');
			break;
			case 'orderBook':
				$data = $pg->query("update catalog_v set onhand_qty = onhand_qty + :qty where book_id = :id",$_POST);
			break;
			case 'findBooks':
				$_POST['in_stock']=array_key_exists('in_stock',$_POST);
				$data = $pg->execFunction("get_catalog",$_POST);
			break;
			case 'buyBook':
				$data=$pg->query("update catalog_v set onhand_qty = onhand_qty-1 where book_id=:id",$_POST,'view','catalog_v');
				break;
			default:
				throw new RuntimeException('Internal error. Unknown server action: '.$action);
			}
		}
		catch(Exception $e){
			$err=new stdClass();
			$err->code = $e->getCode();
			$err->message = $e->getMessage();
			if($e instanceof PDOException){
				if($e->errorInfo){
					$err->code=$e->errorInfo[1];
					$err->message=$e->errorInfo[2];
				}
				elseif(strstr($e->getMessage(), 'SQLSTATE[')){
					preg_match('/^SQLSTATE\[\w+\]\s*\[(\d+)\]\s*(.*)$/ms', $e->getMessage(), $matches);
					$err->code = $matches[1];
					$err->message = $matches[2];
				}
			}
			elseif($e instanceof PgObjectMissingException){
			}
		}
		
		header('content-type:application/json');
		echo json_encode([
			'data'=>$data??null,
			'sql'=>$pg->sql,
			'err'=>$err??null
		]);
?>
