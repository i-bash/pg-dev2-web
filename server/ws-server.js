/** WsServer expects engineClass to provide three handlers.
 * They must be functions returning promises:
 * handleMessage
 * handleCommand
 * handleClose
 */

const http = require('http')
const serveStatic = require('serve-static')
const finalhandler = require('finalhandler')
const WebSocketServer = require('websocket').server
const die=message=>{console.log(message);process.exit(1)}

class WsServer{
	constructor(options){
		//options
		this.port=/^[1-9][0-9]*$/.test(options.port)?parseInt(options.port):die('Incorrect port ('+options.port+'), must be integer')
		this.staticDir=require('path').resolve(__dirname,'../client')
		this.engineClass=options.engine||{}
		//init
		const gag=m=>new Promise((resolve,reject)=>{console.log('called gag');resolve(null)})
		this.connectionId=0
		//logging
		const loggedLength=80
		let loggedText=text=>text.length>loggedLength?text.slice(0,loggedLength-3)+'...':text
		//http server
		const serve = serveStatic(this.staticDir, { 'index': ['index.html'] })
		this.server = http.createServer(
			function(req, res) {
				console.log(new Date().toISOString() + ' Http request: ' + req.url)
				serve(req, res, finalhandler(req, res))
			}
		)
		this.server.on(
			'error',
			e=>{
				const startErrs=['EACCES','EADDRINUSE']
				if(startErrs.includes(e.code)){
					console.log('Cannot start listening: '+e.message)
				}
				else{
					console.log(e.code)
					throw e
				}
			}
		)
		this.server.on(
			'listening',
			()=>{
				console.log(new Date().toISOString() + ' Server is listening on port '+this.port)
				console.log(new Date().toISOString() + ' Serving directory '+this.staticDir)
			}
		)
		this.server.on(
			'close',
			()=>{
				console.log(new Date().toISOString() + ' Stopped listener, exiting')
				process.exit(0)
			}
		)
		//ws server
		let wsServer = new WebSocketServer({
			httpServer: this.server,
			autoAcceptConnections: false
		})
		//process ws request
		wsServer.on(
			'request',
			wsRequest=>{
				let wsConnection=wsRequest.accept('pg-sql',wsRequest.origin)
				//function to send ws message to client
				wsConnection.sendMessage=(msg)=>{
					if(msg!==null){
						let text=JSON.stringify(msg)
						wsConnection.send(text)
						console.log(logPrefix() + 'Sent '+text.length+' bytes to client: '+loggedText(text))
						console.log('socket buffer: '+wsConnection.socket.bufferSize)
					}
				}
				//connect
				this.connectionId++
				let logPrefix=()=>(new Date()).toISOString()+' ('+this.connectionId+') '
				wsConnection.sendMessage('connected '+this.connectionId)
				console.log(logPrefix() + 'Accepted WS connection from ' + wsConnection.remoteAddress)
				//engine
				const engine=new this.engineClass()
				//get message from engine, send it to client
				engine.handleMessage(message=>{wsConnection.sendMessage({data:message})})
				
				//get message from client, send command to engine
				wsConnection.on(
					'message',
					message=>{
						if (message.type !== 'utf8') {
							console.log(logPrefix() + 'Unknown WS message type '+message.type)
							return
						}
						console.log(logPrefix()+'Received '+message.utf8Data.length+' bytes from client: ' + loggedText(message.utf8Data))
						let body
						try{
							body=JSON.parse(message.utf8Data)
						}
						catch(e){
							console.log(logPrefix() + 'Error parsing json message:')
							console.log(e)
							return
						}
						if(body.data==='stop'){
							wsConnection.sendMessage({rid:body.rid,data:'stopping server'})
							console.log(logPrefix() + 'Received smart shutdown request, new connections disallowed')
							this.server.close()
						}
						else{
							engine.handleCommand(body.data)
							.then(
								data=>wsConnection.sendMessage({rid:body.rid,data:data===undefined?{}:data})
							)
							.catch(
								err=>{
									wsConnection.sendMessage({rid:body.rid,data:{err:{name:err.name,message:err.message}}})
								}
							)
						}
					}
				)
				//handle ws close
				wsConnection.on(
					'close',
					(reasonCode, description)=>{
						engine
						.handleClose()
						.then(
							result=>{
								wsConnection.sendMessage('disconnected '+this.connectionId)
								console.log(logPrefix() + 'WS client on ' + wsConnection.remoteAddress + ' disconnected.')
							}
						)
					}
				)
			}
		)
	}
	//listen ws port 
	listen(){
		this.server.listen(this.port)
	}
}

module.exports=WsServer
