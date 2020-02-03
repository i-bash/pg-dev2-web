var lib={

	/**flag
	 */
	requestIsRunning:false,
	
	session:undefined,
	/**contents of sql panel
	 */
	sql:'',
	
	/**separator for contents
	 */
	separator:'<hr>',

	/**server action
	 * @param action - name of server action
	 * @param params - parameters object
	 * @param callback - function(data)
	 * @return promise
	 */
	server: (action,params,callback)=>{
		//if(!lib.requestIsRunning){
		//	lib.requestIsRunning=true;
			$('#loader').addClass('visible').removeClass('invisible');
			let actionPane=$('#action');
			return actionPane.promise().then(
				()=>$.ajax({
					method:'post',
					url:'server.php?action='+action+($('#trace').prop('checked')?'&trace=yes':''),
					data:params,
					success:res=>{
						$('#conninfo').empty();
						if(res.conninfo){
							for(let [key, value] of Object.entries(res.conninfo)){
								$('#conninfo').append('<div class="row"><span class="col-4">'+key+'</span><span class="col-8">'+value+'</span></div>');
							}
						}
						if(res.sql.length){
							let sqlText=res.sql.map(
								s=>{
									return s.trimLeft().replace(/\n/g,'<br/>').replace(/\t/g,'&nbsp;&nbsp;&nbsp;').replace(/\s/g,' ');
								}
							)./*reverse().*/join(lib.separator);
							$('<div/>',{class:'sql alert alert-info',role:'alert'}).html(sqlText).appendTo(actionPane);
						}
						if(res.notices){
							res.notices.forEach(
								notice=>{
									$('<p/>',{class:'alert alert-warning'}).html(notice).appendTo(actionPane);
								}
							);
						}
						res.info.forEach(
							info=>{
								$('<p/>',{class:'alert alert-success'}).html(info).appendTo(actionPane);
							}
						);
						lib.requestIsRunning=false;
						if(res.err===null){
							if(callback!==undefined){
								callback(res.data);
							}
						}
						else{
							$('<p/>',{class:'alert alert-danger'}).html(res.err.message.replace(/\n\s*\^/,'').replace(/\n/g,'<br/>')).appendTo(actionPane);
						}
					},
					error:e=>{
//						lib.requestIsRunning=false;
						alert('Unexpected server error');
						console.err(e);
					},
					complete:()=>{
						$('#loader').addClass('invisible').removeClass('visible');
						$(actionPane).animate({scrollTop:$(actionPane)[0].scrollHeight},1000);
						lib.chkCmd();
					}
				})
			);
		//}
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

	//enable/disable elements
	chkCmd: ()=>{
		$('#login').toggle(lib.session===undefined);
		$('#logout').toggle(lib.session!==undefined);
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
						:callbackAfter
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
	
	populateSelect: selector=>{
		return data=>{
			let dropdown = $(selector);
			data.rows.forEach(row=>{dropdown.append($("<option />").val(row[data.columns[0]]).text(row[data.columns[1]]));});
		}
	}
};
