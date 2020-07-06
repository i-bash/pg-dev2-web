import {lib} from './lib.js'

export class Dev2App{
	//static #lib
	//separator for contents
	static separator='<hr>'
	static connected=false
	static inited=false
	static config
	
	/** enable/disable elements */
	static chkCmd(){
		//set lib.tracing
		lib.tracing=$('#trace').prop('checked')
		//get session info
		let sessionInfo=lib.getSessionInfo()
		//auth header
		$('#session-info').html(sessionInfo.userName)
		$('#logged-in').toggle(sessionInfo.authToken!==null)
		$('#logged-out').toggle(sessionInfo.authToken===null)
		$('#login-form').toggle(false)
		$('#register-form').toggle(false)
	};

	static init(config){
		Dev2App.config=config
		Dev2App.setHandlers()
		$('#led').removeClass().addClass('bg-warning')
		lib.initConnection(
			window.location.hostname+':'+(window.location.port||80),
			()=>$('#led').removeClass().addClass('bg-danger')
		)
		.catch(
			e=>{
				console.log('socket error')
				$('#led').removeClass().addClass('bg-danger')
			}
		)
		.then(
			e=>{
				console.log('connected to ws server')
				$("#led").removeClass().addClass('bg-success')
				lib.populateSelect(
					'#server',
					Dev2App.config.pgServers.map(s=>[s.host+':'+s.port,s.description+' ('+s.port+')'])
				)
				$('#tab-shop').tab('show')
			}
		)
		.catch(console.error)
	}
	
	//display cart info
	static displayCartInfo(res){
		let total=res&&res[0]&&res[0].reduce((prev,cur)=>prev+cur.qty*cur.price,0) || 0
		$('.cart-total').html(total+' ₽')
		$('#cart').prop('disabled',total==0)
	}
	
	//refresh cart info
	static refreshCartInfo(){
		let authToken=lib.getSessionInfo().authToken;
		if(authToken==null){
			$('.cart-total').html(0)
			return Promise.resolve()
		}
		else{
			return lib
			.doAction('web/getCart',{auth_token:authToken})
			.catch()
			.then(Dev2App.displayCartInfo)
		}
	}

	static setHandlers(){
		
		$('#trace').click(Dev2App.chkCmd)
		//display page
		$('#admin a[data-page]').off().click(
			e=>{
				lib.displayPage($(e.target).data('page'))
			}
		);
		$('#login').off().click(
			e=>{
				$('#login-form').toggle(true)
				$('#register-form').toggle(false)
				$('#logged-out').toggle(false)
				$('#logged-in').toggle(false)
				$('#username').focus()
			}
		);
		$('#register').off().click(
			e=>{
				$('#login-form').toggle(false)
				$('#register-form').toggle(true)
				$('#logged-out').toggle(false)
				$('#logged-in').toggle(false)
				$('#reg-username').focus()
			}
		)

		$('button.revert').off().click(Dev2App.chkCmd)

		$('#shop').off().on(
			'loginlogout',
			e=>Dev2App.refreshCartInfo().then(Dev2App.chkCmd)
		)

		//tab
		$('a[data-toggle="tab"]')
		.off()
		.on('shown.bs.tab', function (e) {
			switch(e.target.id){
			case 'tab-shop':
				if(!Dev2App.inited){
					Dev2App.chkCmd()
					$('#header1').trigger('loginlogout')
					Dev2App.inited=true
				}
				lib.displayPage('shop')
			break
			case 'tab-admin':
				lib.displayPage('books')
			break
			}
			return true
		})

		//login
		lib.rpcForm(
			'#login-form>form',
			data=>{
				lib.setSessionInfo(data[0],$('#username').val())
				$('#username').val('')
				$('#header1').trigger('loginlogout')
			}
		);
		//logout
		$('#logout').off().click(
			e=>lib.doAction('web/logout',{auth_token:lib.getSessionInfo().authToken})
			.then(
				()=>{
					lib.resetSessionInfo()
					$('#header1').trigger('loginlogout')
				}
			)
		);
		//register
		lib.rpcForm(
			'#register-form>form',
			data=>{
				lib.reportApp('Пользователь '+$('#reg-username').val()+' зарегистрирован.')
				$('#reg-username').val('')
				$('#reg-email').val('')
				Dev2App.chkCmd()
			}
		);
		//cart
		$('#cart').off().click(e=>{lib.displayPage('cart')})
	}

	/** get cover images for books and display each image in img element with corresponding data-id
	 * returns promise
	 */
	static getCovers(domSelector){
		//request images in chain
		return $(domSelector).toArray().reduce(
			(acc,curElement)=>acc
				.then(()=>lib.doAction('web/getImage',{book_id:$(curElement).data().id}))
				.then(
					d=>{
						let cover16=d[0][0]
						let byteArray = new Uint8Array(cover16.length/2-1)
						for (let x = 0; x < cover16.length-2; x++){
							byteArray[x] = parseInt(cover16.substr(x*2+2,2), 16)
						}
						let blob = new Blob([byteArray],{type:"image/jpeg"})
						let reader = new FileReader()
						reader.onload=()=>{
							$(curElement).attr('src',reader.result)
						}
						reader.readAsDataURL(blob)
						return Promise.resolve()
					}
				)
				.catch(d=>void(d))
			,
			Promise.resolve()
		)
	}
}
