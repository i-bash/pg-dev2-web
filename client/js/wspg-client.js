/** Client for Websocket-Postgres server
 * Constructor:
 * 	options {}
 * 		hostPort
 * Methods:
 * 	wsconnect - connect to WebSockets server
 * 	wsdisconnect - disconnect from WebSockets server
 * 	wsstop - send "stop" command to WebSockets server
 * 	pgconnect - connect PostgreSQL client to database
 * 	pgdisconnect - disconnect PostgreSQL client from database
 * 	pgexec - have PostgreSQL client send an SQL command
 * Events:
 * 	pgnotice - PostgreSQL clent received a notice
 */

export default class WsPgClient{
	/* private fields and methods are not supported by FF
	#hostPort
	#connectResolver
	#disconnectResolver

	#socket
	#rid=1
	#requestPromises=[]
	*/
	/** constructor
	 * saves options in property
	 */
	constructor(hostPort,onclose){
		hostPort||lib.die('please provide host:port to connect to')
		this.hostPort=hostPort
		this.onclose=onclose
		this.rid=1
		this.requestPromises=[]
	}
	/**
	 * private methods
	 */
	log(message,type='log'){
		let f=eval('console.'+type)
		f(message);
	}
	/** public methods
	 */
	wsconnect(){
		return new Promise(
			(resolve,reject)=>{
				this.log('connecting to socket at '+this.hostPort)
				this.connectResolver=resolve
				this.socket = new WebSocket('ws://'+this.hostPort+'/','pg-sql')
				this.socket.onopen=e=>{
					this.log('websocket opened');
					if(this.connectResolver instanceof Function){
						this.connectResolver(e)
					}
				}
				this.socket.onclose=e=>{
					this.log('websocket closed');
					if(this.disconnectResolver instanceof Function){
						this.disconnectResolver(e);
					}
					if(this.onclose instanceof Function){
						this.onclose();
					}
				}
				this.socket.onerror=e=>{
					this.log('websocket client error')
					let p=this.wserror;
					if(p instanceof Function){p(e)}
				}
				this.socket.onmessage=e=>{
					let message;
					try{
						message=JSON.parse(e.data);
					}
					catch(e){
						console.error('received non-json message',e.data)
						return
					}
					//this.log('received message via websocket')
					//this.log(message);
					if(message.rid){
						//handle response
						this.log('got response on request #'+message.rid);
						if(this.requestPromises[message.rid]!==undefined){
							if(message.data.err){
								this.requestPromises[message.rid].reject(message.data);
							}
							else{
								this.requestPromises[message.rid].resolve(message.data);
							}
							delete this.requestPromises[message.rid];
						}
					}
					else{
						if(message.data&&message.data.type==='notice'&&this.pgnotice){
							this.pgnotice(message.data.message)
						}
					}
				}
			}
		)
	}

	/**
	 *  disconnect from socket
	 */
	wsdisconnect(){
		return new Promise(
			(resolve,reject)=>{
				if(this.wsconnected()){
					this.disconnectResolver=resolve
					this.socket.close()
				}
				else{
					reject(new Error('socket is not open'))
				}
			}
		)
	}
	/**
	 * is client still connected?
	 */
	wsconnected(){
		return this.socket!==undefined&&this.socket.readyState==WebSocket.OPEN;
	}
	/**
	 * stop the server
	 */
	wsstop(){
		return this.request('stop')
	}
	/**
	 * generic 'send request and wait for response' function
	 */
	wsrequest(data){
		return new Promise(
			(resolve,reject)=>{
				if(this.wsconnected()){
					let rid=this.rid++
					if(data==='stop'){
						this.disconnectResolver=resolve
					}
					else{
						this.requestPromises[rid]={resolve,reject}
					}
					this.log('sending request #'+rid);
					this.socket.send(JSON.stringify({rid,data}))
				}
				else{
					reject('not connected to websocket server')
				}
			}
		)
	}
	//////// pg-specific requests
	/**
	 * connect to pg server
	 */
	pgconnect(connectString){
		return this.wsrequest({type:'connect',data:connectString})
	}
	/**
	 * disconnect from pg server
	 */
	pgdisconnect(connectionId){
		return this.wsrequest({type:'disconnect',data:connectionId})
	}
	/**
	 * exec sql command on pg server
	 */
	pgexec(connectionId,sql,params){
		return this.wsrequest({type:'exec',data:{connection:connectionId,sql,params}})
	}
	/** exec pg function */
	pgfunction(fname,fpars){
		let sql=
			'select * from '+fname+' ('+
				(fpars.length?fpars.keys().map((parName,parNum)=>parName+'=>$'+(parNum+1)).join(','):'')+
			')'
		;
		return this.pgexec(sql,fpars.values());
	}
	/** execute commands synchronously
	 * commands - array
	 * return: promise
	 */
	pgrun(commands){
		let cmd=commands.shift()
		return this.pgexec(cmd).then(this.pgrun(commands))
	}
}
