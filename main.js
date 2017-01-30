var lib={}

$(()=>{
	
	lib.server=(action,params,callback)=>{
		$('#loader').fadeIn('fast');
		$('#error,#success,#sql').hide();
		$.ajax({
			method:'post',
			url:'server.php?action='+action,
			data:params,
			success:(res)=>{
				if(res.sql!=null){
					$('#sql').html(res.sql).fadeIn('slow');
				}
				if(res.err===null){
					if(callback!==undefined){
						callback(res.data);
					}
					$('#success').fadeIn('slow');
				}
				else{
					$('#error').html(res.err.message).fadeIn('slow');
				}
				$('#loader').fadeOut();
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
				console.log(form);
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

	//fill in roles
	lib.server(
		'getRoles',
		{},
		data=>{
			let select=$('#role');
			data.forEach(r=>{
				$('<option/>').val(r).html(r).appendTo(select);
			});
		}
	);

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
});

