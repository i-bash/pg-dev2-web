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
				$('<div/>',{class:'row book mt-3 mb-3'})
				.data('book',r)
				.data('id',r.book_id)
				//cover
				.append(
					$('<span/>',{class:'col-2 text-center cover-cell'})
					.append(
						$('<a/>',{href:'#'})
						.append(
							$('<img/>',{src:'img/book.png',class:'cover mw-100 mh-100'})
							.attr('data-id',r.book_id)
						)
					)
				)
				//title and authors
				.append(
					$('<span/>',{class:'col-4 text-left'})
					.append($('<div/>',{class:'text-truncate'}).html(r.title))
					.append(
						$('<div/>',{class:'text-truncate'})
						.html(
							r.authors_list.map(
								author=>author.last_name+' '+author.first_name[0]+'.'+(author.middle_name?' '+author.middle_name[0]+'.':'')
							).join(', ')
						)
					)
				)
				//rating
				.append(
					$('<div/>',{class:'col-1 p-0'})
					.append(
						$('<div/>',{class:'border'})
						.append(
							$('<div/>',{class:'rating bg-warning'}).css({width:r.rating*100+'%'})
						)
					)
				)
				//format, price
				.append($('<span/>',{class:'col-2 text-center'}).html(r.format))
				.append($('<span/>',{class:'col-1 text-right text-nowrap'}).html(r.price+' ₽'))
				//to cart
				.append($('<span/>',{class:'col-2'}).append(
					$('<button/>',{type:'button',class:'btn btn-secondary btn-sm to-cart'}).html('В корзину')
				))
				.appendTo(list)
			}
		)
		showList()
		$('#books').toggle(rows.length>0)
		lib.reportApp(rows.length==0?'Книги не найдены':'Найдено книг: '+rows.length)
		Dev2App.getCovers('img.cover');
	};
	//display book details
	let showDetails=row=>{
		let data=row.data('book')
		$('#book').data('id',data.book_id)
		$('#det-cover').attr('src',row.find('img[data-id="'+data.book_id+'"]').attr('src'))
		$('#det-name').html(data.title)
		$('#det-authors').html(data.authors_list.map(r=>r.last_name+' '+r.first_name+' '+r.middle_name).join(',<br>'))
		$('#det-rating').add(data.rating)
		$('#det-votes-up').html(data.votes_up)
		$('#det-votes-down').html(data.votes_down)
		$('#det-format').html(data.format)
		$('#book-properties>.row:nth-child(n+5)').remove()
		$('#book-properties').append(
			(typeof(data.additional)=='object'&&data.additional!=null)
			?Object
			.entries(data.additional)
			.filter(entry=>entry[1]!==null)
			.map(
				entry=>
				$('<div/>',{class:'row'})
				.append($('<div/>',{class:'col-3'}).html(entry[0]))
				.append($('<div/>',{class:'col-9'}).html(entry[1]))
			)
			:[]
		)
		$('#det-price').html(data.price)
		$('#to-cart').data('id',data.book_id)
		$('#book').toggle(true)
		$('#books').toggle(false)
		$('#header1').trigger('loginlogout')
	};
	//display list of books
	let showList=()=>{
		$('#book').toggle(false)
		$('#books').toggle(true)
		$('#header1').trigger('loginlogout')
	};
	
	//event handlers
	$('[name="orderby"],[name="direction"]').off().change(()=>{$('#search').submit()})
	
	$('#books,#book-details').off()
	
	$('#books')
	.on('show load ','img',alert)
	.on('click','img',e=>showDetails($(e.target).closest('.book')))
	
	$('#header1')
	.on(
		'loginlogout',
		e=>{
			//enable to-cart and vote buttons for logged in user only
			$('#books,#book').find('button.to-cart,button.vote').toggle(sessionStorage.getItem('authToken')!==null);
		}
	)
	
	$('#books,#book-details').on(
		'click',
		'button.to-cart',
		e=>{
			lib.doAction(
				'web/toCart',
				{
					book_id:$(e.target).closest('.book').data('id'),
					auth_token:sessionStorage.getItem('authToken'),
					qty:1
				}
			)
			.then(d=>lib.reportApp('added to cart'))
			.then(Dev2App.refreshCartInfo)
		}
	)
	
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
			)
		}
	)
	
	$('#to-list').off().click(showList)
	
	//init
	lib.rpcForm('#search',initBooks)
}
