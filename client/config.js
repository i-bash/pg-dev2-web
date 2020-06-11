export var config={
		wsServer:{host:'localhost',port:'8080'},
		pgServers:[
			{host:'localhost',port:'6432',description:'пул соединений'},
			{host:'localhost',port:'5432',description:'основной сервер'},
			{host:'localhost',port:'5433',description:'реплика'}
		]
};
