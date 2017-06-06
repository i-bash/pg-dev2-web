<?php
class PgCheckObject{
	private static $checks=[
		"getAuthors"=>[
			'type'=>'relation',
			'name'=>'authors_v',
			'message'=>'Представление для списка авторов будет создано в теме 9 "Взаимодействие приложения с СУБД"'
		],
		"addAuthor"=>[
			'type'=>'function',
			'name'=>'add_author',
			'message'=>'Функция для добавления автора будет создана в теме 14 "Выполнение запросов"'
		],
		"getBooks"=>[
			'type'=>'relation',
			'name'=>'catalog_v',
			'message'=>'Представление для списка книг будет создано в теме 9 "Взаимодействие приложения с СУБД"'
		],
		"addBook"=>[
			'type'=>'function',
			'name'=>'add_book',
			'message'=>'Функция для добавления книги будет создана в теме 17 "Массивы"'
		],
		"orderBook"=>[
			'type'=>'trigger',
			'relation'=>'catalog_v',
			'tgtype'=>81, //instead of update
			'message'=>'Триггер для обновления представления будет создан в теме 19 "Триггеры"'
		],
		"findBooks"=>[
			'type'=>'function',
			'name'=>'get_catalog',
			'message'=>'Функция для поиска книг будет создана в теме 11 "Составные типы и табличные функции"'
		],
		"buyBook"=>[
			'type'=>'function',
			'name'=>'buy_book',
			'message'=>'Функция для покупки книги будет создана в теме 14 "Выполнение запросов"'
		],
	];
	
	private $pg; //db connection
	
	function __construct(Pg $pg){
		$this->pg=$pg;
	}
	
	static function create(Pg $pg){
		return new self($pg);
	}
	
	public function checkObject($action){
		$messages=[];
		if($check=self::$checks[$action]??false){
			$check=(object)$check;
			$exists=true;
			switch($check->type){
				case 'function':
					$exists=$this->checkFunctionExistence($check->name);
					break;
				case 'trigger':
					$exists=$this->checkTriggerExistence($check->relation,$check->tgtype);
					break;
				case 'relation':
					$exists=$this->checkRelationExistence($check->name);
					break;
			}

			return $exists?'':$check->message;
		}
	}
	/**
	 * @param name - relation name
	 */
	public function checkRelationExistence($name){
		try{
			$res=$this->pg->query(
				"select pg_catalog.pg_table_is_visible($1::regclass) ok",
				[$name],
				false
			);
			return $res[0]->ok=='t';
		}
		catch(PgException $e){
			return false;
		}
	}
	/**
	 * @param name - function name
	 */
	public function checkFunctionExistence($name){
		try{
			$res=$this->pg->query(
				"select pg_catalog.pg_function_is_visible($1::regproc) ok",
				[$name],
				false
			);
			return $res[0]->ok=='t';
		}
		catch(PgException $e){
			return false;
		}
	}
	/**
	 * @param relation - relation name
	 * @param type - trigger type, see pg_trigger.tgtype
	 */
	public function checkTriggerExistence(string $relation,int $tgtype){
		try{
			$res=$this->pg->query(
				"select 't'
				from pg_trigger
				where tgrelid=$1::regclass
				  and tgtype=$2
				  and tgattr={}
				",
				[$relation,$tgtype],
				false
			);
			return count($res)==1;
		}
		catch(PgException $e){
			return false;
		}
	}
}
