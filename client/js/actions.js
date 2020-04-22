export default {
	'web/register'    :{conn:'web',commands:[{type:'function',text:'webapi.register_user'}]},
	'web/login'       :{conn:'web',commands:[{type:'function',text:'webapi.login'}]},
	'web/logout'      :{conn:'web',commands:[{type:'function',text:'webapi.logout'}]},
	'web/findBooks'   :{conn:'web',commands:[{type:'function',text:'webapi.get_catalog'}]},
	'web/getImage'    :{conn:'web',commands:[{type:'function',text:'webapi.get_image'}]},
	'web/vote'        :{conn:'web',commands:[{type:'function',text:'webapi.cast_vote'}]},
	'web/toCart'      :{conn:'web',commands:[{type:'function',text:'webapi.add_to_cart'}]},
	'web/getCart'     :{conn:'web',commands:[{type:'function',text:'webapi.get_cart'}]},
	'web/fromCart'    :{conn:'web',commands:[{type:'function',text:'webapi.remove_from_cart'}]},
	'web/checkout'    :{conn:'web',commands:[{type:'function',text:'webapi.checkout'}]},
	'emp/getBooks'    :{conn:'emp',commands:[{type:'function',text:'empapi.get_catalog'}]},
	'emp/getPrograms' :{conn:'emp',commands:[{type:'function',text:'empapi.get_programs'}]},
	'emp/getTasks'    :{conn:'emp',commands:[{type:'function',text:'empapi.get_tasks'}]},
	'emp/taskResults' :{conn:'emp',commands:[{type:'function',text:'empapi.task_results'}]}
}
