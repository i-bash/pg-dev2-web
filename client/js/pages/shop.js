import {lib} from '../lib.js'
import {Dev2App} from '../dev2app.js'

export default function(){
	//fill and initially display list of books
	let initBooks=res=>{
		let list=$('#books')
		let rows=res[0]
		list.children('div:not(:first-child)').remove();
		rows.forEach(
			r=>{
				$('<div/>',{class:'row book'})
					.data('book',r)
					.data('id',r.book_id)
					.append(
						$('<span/>',{class:'col-2'})
							.append(
								$('<a/>',{href:'#'}).append($('<img/>',{id:'cover'+r.book_id,src:'img/book.png',class:'w-50'})) //'server.php?action=web/getImage&book_id='+r.book_id
						)
					)
					.append(
						$('<span/>',{class:'col-4'})
						.html(
							r.title+
							'. '+
							r.authors_list.map(
								author=>author.last_name+' '+author.first_name[0]+'.'+(author.last_name?' '+author.last_name[0]+'.':'')
							).join(', ')
						)
					)
					.append($('<span/>',{class:'col-1'}).html(r.rating))
					.append($('<span/>',{class:'col-2'}).html(r.format))
					.append($('<span/>',{class:'col-1 text-right'}).html(r.price))
					.append($('<span/>',{class:'col-2'}).append(
						$('<button/>',{type:'button',class:'btn btn-secondary btn-sm to-cart'}).html('В корзину')
					))
					.appendTo(list)
				;
			}
		)
		showList()
		$('#books').toggle(rows.length>0)
		lib.reportApp(rows.length==0?'Книги не найдены':'Найдено книг: '+rows.length)
		//request images in chain
		rows.reduce(
			(acc,cur)=>acc
				.then(()=>lib.doAction('web/getImage',{book_id:cur.book_id}))
				.then(
					d=>{
						//console.log(d);
						$('img#cover'+cur.book_id)
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
			,
			Promise.resolve()
		)
	};
	//display book details
	let showDetails=row=>{
		let data=row.data('book')
		$('#book').data('id',data.book_id);
		$('#det-cover').attr('src',row.find('img#cover'+data.book_id).attr('src'));
		$('#det-name').html(data.title);
		$('#det-authors').html(data.authors_list.map(r=>r.last_name+' '+r.first_name+' '+r.middle_name).join(',<br>'));
		$('#det-rating').html(data.rating);
		$('#det-votes-up').html(data.votes_up);
		$('#det-votes-down').html(data.votes_down);
		$('#det-format').html(data.format);
		$('#det-other').html(data.additional);
		$('#det-price').html(data.price).siblings('button').data('id',data.book_id);
		$('#book').toggle(true);
		$('#books').toggle(false);
//		$('#shop').trigger('shop:login-logout');
	};
	//display list of books
	let showList=()=>{
		$('#book').toggle(false);
		$('#books').toggle(true);
//		$('#shop').trigger('shop:login-logout');
	};
	
	//event handlers
	
	$('#shop').off().on(
		'shop:login-logout',
		e=>{
			//enable to-cart and vote buttons for logged in user only
			$('#books,#book').find('button.to-cart,button.vote').toggle(sessionStorage.getItem('authToken')!==null);
			//display cart info in header
			Dev2App.refreshCartInfo();
		}
	);
	
	$('#orderby,#direction').off().change(
		()=>{
			$('#search').submit();
		}
	);
	
	$('#books,#book-details').off()
	$('#books')
	.on('show load ','img',alert)
	.on(
		'click',
		'img',
		e=>showDetails($(e.target).closest('.book'))
	);
	$('#books,#book-details').on(
		'click',
		'button.to-cart',
		e=>{
			lib.doAction(
				'web/toCart',
				{book_id:$(e.target).closest('.book').data('id'),auth_token:sessionStorage.getItem('authToken')}
			)
			.then(
				data=>{
					lib.reportApp('added to cart')
					Dev2App.refreshCartInfo()
				}
			)
		}
	);
	$('.vote').off().click(
		e=>{
			let btn=$(e.target)
			let counter=btn.parent().next()
			lib.doAction(
				'web/vote',
				{vote:btn.data('vote'),book_id:$(e.target).closest('.book').data('id'),auth_token:sessionStorage.getItem('authToken')}
			)
			.then(
				res=>{
					counter.html(Number(counter.html())+1)
					lib.reportApp('voted')
				}
			);
		}
	);
	$('#to-list').off().click(showList);
	
	//init
	lib.rpcForm('#search',initBooks);
}
