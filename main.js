var lib={}

$(()=>{
	
	lib.clearSql=()=>{
		$('#sql').empty();
	};
	
	lib.server=(action,params,callback)=>{
		$('#error,#success,#sql').hide();
		$('#loader').show();
		$.ajax({
			method:'post',
			url:'server.php?action='+action,
			data:params,
			success:(res)=>{
				if(res.sql!=null){
					let html=$('#sql').html();
					$('#sql').html(
						res.sql.trimLeft().replace(/\n/g,'<br/>').replace(/\t/g,'&nbsp;')
						+(html?'<br/>---<br/>':'')
						+html
					).slideDown('slow');
				}
				if(res.err===null){
					if(callback!==undefined){
						callback(res.data);
					}
					//$('#success').slideDown('slow');
				}
				else{
					$('#error').html(
						res.err.message.replace(/\n\s*\^/,'').replace(/\n/g,'<br/>')
					).slideDown('slow');
				}
				$('#loader').fadeOut('slow');
			},
			error:(e)=>{
				alert('Unexpected server error');
				console.error(e);
			}
		});
	}

	lib.displayPage=page=>{
		$.ajax('pages/'+page+'.html')
			.then(
				html=>{
					$('#page').hide().html(html).fadeIn();
					//return $.ajax('pages/'+page+'.js');
				},
				()=>{$('#page').html('Page "'+page+'" not found');}
			)
/*
			.then(
				js=>{
					$('#page-js').html(js);
				},
				()=>{console.warn(page+'.js not found');}
			)
*/
		;
		
	}
	
	//turn form into ajax
	lib.ajaxForm=(form,callback)=>{
		form.submit(
			e=>{
				e.preventDefault();
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
	}

	//select role
	$('#role').change((e)=>{
		lib.server('setRole',{'role':$(e.target).val()});
	});

	//display page
	$('.btn[data-page]').click(
		e=>{
			lib.displayPage($(e.target).data('page'));
		}
	);
	//fill in roles
	lib.server(
		'getRoles',
		{},
		data=>{
			let select=$('#role');
			data.forEach(r=>{
				$('<option/>').val(r).html(r).appendTo(select);
			});
			$('#role').trigger('change');
		}
	);
});

