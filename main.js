var lib={

	/**flag
	 */
	//requestIsRunning:false,
	
	/**contents of sql panel
	 */
	//sql:'',
	
	/**separator for contents
	 */
	separator:'<hr>',

	/**server action
	 * @param action - name of server action
	 * @param params - parameters object
	 * @param callback - function(data)
	 * @return promise
	 */
	server: (action,params,callback,callbackData)=>{
		//action
		let user='postgres';
		[user,action]=action.split('/');
		//server
		let connectData=$("#server option:selected").data();
		//other connect data
		connectData.user=user;
		connectData.password=user;
		connectData.dbname='bookstore2';
		$('#loader').addClass('visible').removeClass('invisible');
		let actionPane=$('#action');
		return actionPane.promise().then(
			()=>$.ajax({
				method:'post',
				url:'server.php?'+$.param(
					{
						connectString:Object.entries(connectData).map(entry=>entry[0]+'='+entry[1]).join(' '),
						action:action,
						trace:$('#trace').prop('checked')
					}
				),
				data:params,
				success:res=>{
					if(res.conninfo){
						$('<div/>',{class:'sql alert alert-light w-100',role:'alert'})
						.html(Object.entries(res.conninfo).map(e=>e[0]+': '+e[1]).join('<br>'))
						.appendTo(actionPane)
						;
					}
					if(res.sql.length){
						let sqlText=res.sql.map(
							s=>{
								return s.trimLeft().replace(/\n/g,'<br/>').replace(/\t/g,'&nbsp;&nbsp;&nbsp;').replace(/\s/g,' ');
							}
						)./*reverse().*/join(lib.separator);
						$('<div/>',{class:'sql alert alert-info w-100'}).html(sqlText).appendTo(actionPane);
					}
					if(res.notices){
						res.notices.forEach(
							notice=>{
								$('<p/>',{class:'alert alert-warning w-100'}).html(notice).appendTo(actionPane);
							}
						);
					}
					/*
					res.info.forEach(
						info=>{
							$('<p/>',{class:'alert alert-success w-100'}).html(info).appendTo(actionPane);
						}
					);
					lib.requestIsRunning=false;
					*/
					if(res.err===null){
						if(callback!==undefined){
							callback(res.data,callbackData);
						}
					}
					else{
						$('<p/>',{class:'alert alert-danger'}).html(res.err.message.replace(/\n\s*\^/,'').replace(/\n/g,'<br/>')).appendTo(actionPane);
					}
				},
				error:e=>{
					alert('Unexpected server error');
					console.error(e);
				},
				complete:()=>{
					$('#loader').addClass('invisible').removeClass('visible');
					$(actionPane).animate({scrollTop:$(actionPane)[0].scrollHeight},1000);
					lib.chkCmd();
				}
			})
		);
	},

	//display app page
	displayPage: page=>{
		lib.clearPanes();
		$.ajax('pages/'+page+'.html')
			.then(
				html=>{
					$('#page').hide().html(html).fadeIn().removeClass().addClass(page);
				},
				()=>{$('#page').html('Page "'+page+'" not found');}
			)
		;
	},
	clearPage: page=>{
		lib.clearPanes();
		$('#page').empty();
	},

	//enable/disable elements in tech pane
	chkCmd: ()=>{
		$('#btn-conninfo').toggleClass('disabled',$('#conninfo').html()=='');
		$('#trace').prop('disabled',$('#conninfo').html()=='');
	},

	//turn form into ajax
	ajaxForm: (selector,callbackAfter,callbackBefore)=>{
		$(document).off('submit',selector);
		$(document).on(
			'submit',
			selector,
			function(e){
				e.preventDefault();
				let form=this;
				if(callbackBefore!==undefined&&!callbackBefore(this)){
					return false;
				};
				//lib.clearPanes();
				lib.server(
					$(form).attr('action'),
					$(form).serialize(),
					callbackAfter===undefined
						?()=>{console.info('ajax form ok');}
						:callbackAfter,
					form
				);
			}
		);
	},

	//display alert
	alert: (message,style='info')=>{
		alert(message);
		//$('<div/>',{class:'alert alert-'+style+' fade',role:'alert'}).html(message).appendTo('#alert').addClass('in').delay(2000).slideUp('slow',function(){$(this).remove();});
	},

	//append contents to pane
	addContents: (oldContents,newContents)=>{
		return oldContents+(oldContents&&newContents?lib.separator:'')+newContents;
	},

	//clear contents of sql, success, error, notice panels
	clearPanes: ()=>{
		$('#action').empty();
		$('#conninfo').empty();
	},
	
	//populate select from array of options
	populateSelect: (selector,options)=>{
		let dropdown = $(selector);
		options.forEach(
			option=>{
				let element=$("<option />")
				.val(Array.isArray(option)?option[0]:option)
				.text(Array.isArray(option)?option[1]:option)
				;
				if(Array.isArray(option)&&option[2]!==undefined){
					element.data(option[2]);
				}
				dropdown.append(element);
			}
		);
	},
	
	//populate select from server data - use as callback
	populateSelectFromData: selector=>{
		return data=>
			lib.populateSelect(
				$(selector),
				data.rows.map(row=>[row[data.columns[0]],row[data.columns[1]]])
			)
		;
	}
};
