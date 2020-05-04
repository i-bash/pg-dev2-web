import {lib} from './lib.js'

export class Dev2App{
	//static #lib
	//separator for contents
	static separator='<hr>'
	static connected=false
	
	/**
	 * enable/disable elements
	 */
	static chkCmd(){
		//get auth info from sessionStorage
		let authToken=sessionStorage.getItem('authToken');
		let userName=sessionStorage.getItem('userName');
		//auth header
		$('#session-info').html(userName+' ('+authToken+')');
		$('#logged-in').toggle(authToken!==null);
		$('#logged-out').toggle(authToken===null);
		$('#login-form').toggle(false);
		$('#register-form').toggle(false);
		$('#cart').prop('disabled',$('.cart-total').html()=='0')
	};

	static init(config){
		Dev2App.setHandlers();
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
				Dev2App.initUi(config);
			}
		)
		.catch(console.error)
	}
	
	//display cart info
	static displayCartInfo(res){
		$('.cart-total').html(
			res&&res[0]&&res[0].reduce((prev,cur)=>prev+cur.qty*cur.price,0) || '0'
		)
		Dev2App.chkCmd()
	}
	
	//refresh cart info
	static refreshCartInfo(){
		let authToken=sessionStorage.getItem('authToken');
		if(authToken==null){
			$('.cart-total').html(0)
			return Promise.resolve()
		}
		else{
			return lib
			.doAction('web/getCart',{auth_token:authToken})
			.catch(e=>Dev2App.displayCartInfo())
			.then(Dev2App.displayCartInfo)
		}
	}

	static initUi(config){
		//init ui
		lib.populateSelect(
			'#server',
			config.pgServers.map(
				s=>[
					s.host+':'+s.port,
					s.host+':'+s.port
				]
			)
		);
		Dev2App.refreshCartInfo().then(d=>Dev2App.chkCmd())
	}

	static setHandlers(){
		//set lib.tracing
		$('#trace').click(e=>lib.tracing=$(e.target).prop('checked'))
		//display page
		$('#admin a[data-page]').off().click(
			e=>{
				lib.displayPage($(e.target).data('page'));
			}
		);
		$('#login').off().click(
			e=>{
				$('#login-form').toggle(true);
				$('#register-form').toggle(false);
				$('#logged-out').toggle(false);
				$('#logged-in').toggle(false);
				$('#username').focus();
			}
		);
		$('#register').off().click(
			e=>{
				$('#login-form').toggle(false);
				$('#register-form').toggle(true);
				$('#logged-out').toggle(false);
				$('#logged-in').toggle(false);
				$('#reg-username').focus();
			}
		);
		$('button.revert').off().click(Dev2App.chkCmd);
		
		//tab
		$('a[data-toggle="tab"]')
		.off()
		.on('shown.bs.tab', function (e) {
			switch(e.target.id){
			case 'tab-shop':
				lib.displayPage('shop');
			break;
			case 'tab-admin':
				lib.clearPage();
			break;
			}
		})

		//login
		lib.rpcForm(
			'#login-form>form',
			data=>{
				sessionStorage.setItem('authToken',data[0]);
				sessionStorage.setItem('userName',$('#username').val());
				$('#username').val('');
				$('#shop').trigger('shop:login-logout');
				Dev2App.chkCmd();
			}
		);
		//logout
		$('#logout').off().click(
			e=>lib.doAction('web/logout',{auth_token:sessionStorage.getItem('authToken')})
			.then(
				()=>{
					sessionStorage.removeItem('authToken');
					sessionStorage.removeItem('userName');
					$('#shop').trigger('shop:login-logout');
					Dev2App.chkCmd();
				}
			)
		);
		//register
		lib.rpcForm(
			'#register-form>form',
			data=>{
				lib.reportApp('Пользователь '+$('#reg-username').val()+' зарегистрирован.');
				$('#reg-username').val('');
				$('#reg-email').val('');
				Dev2App.chkCmd();
			}
		);
		//cart
		$('#cart').off().click(e=>{lib.displayPage('cart');});
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
						//console.log(d);
						$(curElement)
						.attr(
							'src',
							'data:image/jpeg;base64,'+
							btoa(
								d[0][0]
								.slice(2)
								.match(/\w{2}/g)
								.map(a=>String.fromCharCode(parseInt(a,16)))
								.join('')
							)
						)
						return Promise.resolve()
					}
				)
				.catch(d=>void(d))
			,
			Promise.resolve()
		)
	}

	/**	
	//enable/disable elements in tech pane
	chkCmd: ()=>{
		$('#btn-conninfo').toggleClass('disabled',$('#conninfo').html()=='');
		$('#trace').prop('disabled',$('#conninfo').html()=='');
	},

	//display alert
	alert: (message,style='info')=>{
		//alert(message);
		$('<div/>',{class:'alert alert-'+style+' alert-dismissible fade show in',role:'alert'})
			.html(message)
			.appendTo('#alert')
			//.addClass('in')
			.delay(5000)
			.slideUp('slow',function(){$(this).remove();})
			;
	},

	//append contents to pane
	addContents: (oldContents,newContents)=>{
		return oldContents+(oldContents&&newContents?lib.separator:'')+newContents;
	},

****/

};
