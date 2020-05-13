const PgClient = require('pg').Client
const EventEmitter = require('events').EventEmitter;

/** This "engine" for WSServer handles three types of commands
 * -----------+-----------------------------+-------------------
 * type       | data                        | returned value
 * -----------+-----------------------------+-------------------
 * connect    | postgres:/connection-string | new connection id
 * disconnect | connection                  |
 * exec       | {connection,sql,params}     | result object
 * -----------+-----------------------------+-------------------
 * 
 */

class PgEngine{
	/**
	#pgClient
	**/
	
	pgErrorHandler(err){
		console.log('pg-error');
		let message=err.stack.split('\n')[0];
		console.log('PostgreSQL error',message);
	}

	pgCloseHandler(err){
		console.log('pg-engine: closed connection');
	}

	constructor() {
		this.connections=[]
		this.eventEmitter = new EventEmitter()
		//attach handler to pg notice event
		this.handleMessage=handler=>{
			this.eventEmitter.on('notice',handler);
		}
		//handler for db command (connect/disconnect/exec)
		this.handleCommand=appMessage=>{
			return new Promise(
				(resolve,reject)=>{
					let connectionId
					let pgClient
					//parse incoming message
					switch(appMessage.type){
					case 'connect':
						pgClient=new PgClient({connectionString:appMessage.data})
						pgClient
							.on('error',this.pgErrorHandler)
							.on(
								'notice',
								notice=>{
									console.log('pg-engine: received notice: ',notice.message)
									this.eventEmitter.emit('notice',{type:'notice',message:notice.message})
								}
							)
							.on('end',this.pgCloseHandler)
							.connect()
							.then(()=>resolve(this.connections.push(pgClient)-1))
							.then(()=>console.log('pg-engine: connected to '+JSON.stringify(appMessage.data)))
							.catch(err=>reject({message:err.message}))
						;
					break;
					case 'disconnect':
						connectionId=appMessage.data
						if(connectionId in this.connections){
							this.connections[connectionId]
								.end()
								.then(resolve)
								.catch(err=>reject({message:err.message}))
						}
						else{
							reject('connection '+connectionId+' does not exist')
						}
					break;
					case 'exec':
						if(appMessage.data&&appMessage.data.connection!==undefined){
							connectionId=appMessage.data.connection
							let sql=appMessage.data.sql
							console.log('pg-engine: connection '+connectionId+', execing '+JSON.stringify(sql));
							if(this.connections[connectionId]){
								this.connections[connectionId]
								.query(appMessage.data.sql,appMessage.data.params)
								.then(resolve)
								.catch(err=>reject({message:err.message}))
							}
							else{
								reject({message:'connection '+connectionId+' does not exist'})
							}
						}
						else{
							reject({message:'pg-engine: malformed command: '+JSON.stringify(appMessage)})
						}
					break;
					default:
						console.log('pg-engine: unknown app command "'+appMessage.type+'"');
						reject({message:'unknown app action type: '+appMessage.type});
					}
				}
			)
		}
		//close all pg connections on ws close
		this.handleClose=()=>Promise.all(
			this.connections.map(
				conn=>conn
				.end()
				.catch(
					e=>console.log('cannot close pg connection '+JSON.stringify(e))
				)
			)
		)
	}
};

module.exports=PgEngine
