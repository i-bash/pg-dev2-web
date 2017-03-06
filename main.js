var lib={

	/**flag
	 */
	requestIsRunning:false,
	/**contents of sql panel
	 */
	sql:'',

	/**server action
	 * @param action - name of server action
	 * @param params - parameters object
	 * @param callback - function(data)
	 * @return promise
	 */
	server: (action,params,callback)=>{
		if(!lib.requestIsRunning){
			$('#error,#success').hide();
			$('#loader').show();
			lib.requestIsRunning=true;
			return $.ajax({
				method:'post',
				url:'server.php?action='+action,
				data:params,
				success:res=>{
					let separator='<br/>---<br/>';
					if(res.sql.length){
						lib.sql=
							res.sql.map(
								s=>{
									return s.trimLeft().replace(/\n/g,'<br/>').replace(/\t/g,'&nbsp;');
								}
							)
							.reverse()
							.join(separator)
							+(lib.sql&&res.sql?separator:'')
							+lib.sql
						;
						$('#sql')
							.fadeOut(
								'slow',
								()=>{$('#sql').html(lib.sql).fadeIn('slow');}
							)
						;
					}
					lib.requestIsRunning=false;
					if(res.err===null){
						if(callback!==undefined){
							callback(res.data);
						}
					}
					else{
						$('#error').html(
							res.err.message.replace(/\n\s*\^/,'').replace(/\n/g,'<br/>')
						).slideDown('slow');
					}
				},
				error:e=>{
					lib.requestIsRunning=false;
					alert('Unexpected server error');
					console.error(e);
				},
				complete:()=>{
					$('#loader').fadeOut('slow');
				}
			});
		}
	},

	//display app page
	displayPage: page=>{
		$.ajax('pages/'+page+'.html')
			.then(
				html=>{
					$('#page').hide().html(html).fadeIn().removeClass().addClass(page);
				},
				()=>{$('#page').html('Page "'+page+'" not found');}
			)
		;
	},

	//turn form into ajax
	ajaxForm: (selector,callback,extraPars=[])=>{
		$(document).off('submit',selector);
		$(document).on(
			'submit',
			selector,
			function(e){
				e.preventDefault();
				let form=this;
				lib.clearSql();
				lib.server(
					$(form).attr('action'),
					$(form).serialize(),
					callback===undefined
						?()=>{console.info('ajax form ok');}
						:callback
				);
			}
		);
	},

	//display alert
	alert: (message,style='info')=>{
		$('<div/>',{class:'alert alert-'+style+' fade'}).html(message).appendTo('#alert').addClass('in').delay(2000).slideUp('slow',function(){$(this).remove();});
	},

	//clear contents of sql panel
	clearSql: ()=>{
		lib.sql='';
		$('#sql').fadeOut('slow',()=>{$('#sql').empty().hide();});
	}

};
