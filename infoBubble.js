var infoBubble = new Class({

	Implements: Options,
	
	bubble: null,
	delay: null,
	elements: null,
	tipHeight: 10,
	visible: false,

	options: {
		contentMargin: 10,
		fade: true,
		fxDuration: 250,
		hideDelay: 2500,
		marginBottom: 10,
		marginTop: -20,
		size: {
			height: 200,
			width: 250
		}
	},
	
	initialize: function(selector)
	{
		this.elements = $$(selector);
		
		this.attach();
		this.createBubble();
	},
	
	attach: function()
	{
		this.elements.each(function(el){
			el.addEvents({
				'click': function(e){
					e.stop();
				}.bind(this),
				'mouseleave': function(){
					this.hideBubble();
				}.bind(this),
				'mouseover': function(){
					this.showBubble(el);
				}.bind(this)
			});
		}, this);
	},
	
	clearDelay: function()
	{
		$clear(this.delay);
	},
	
	createBubble: function()
	{
		this.bubbleContainer = new Element('div', {
			'class': 'infoBubble',
			styles: {
				height: this.options.size.height + this.tipHeight + (this.options.contentMargin * 2),
				marginTop: this.options.marginTop,
				opacity: 0,
				top: -1000,
				width: this.options.size.width + (this.options.contentMargin * 2)
			}
		}).inject(document.body);;
		
		this.bubble = new Element('div', {
			'class': 'infoBubble-Bubble',
			events: {
				'mouseleave': function(){
					this.hideBubble();
				}.bind(this),
				'mouseover': function(){
					this.clearDelay();
				}.bind(this)
			},
			styles: {
				height: this.options.size.height + (this.options.contentMargin * 2)
			}
		}).inject(this.bubbleContainer);
		
		if(this.options.fade)
		{
			this.bubbleContainer.store('fxInstance', new Fx.Morph(this.bubbleContainer, {
				duration: this.options.fxDuration
			}));
		}
		
		this.bubbleContent = new Element('div', {
			'class': 'infoBubble-Content',
			styles: {
				height: this.options.size.height
			}
		}).inject(this.bubble);
	},
	
	getContent: function(el)
	{
		this.resetBubble();
		
		var href = el.get('href');

		if(href.substr(0, 1) == '#')
		{
			var id = href.substr(1);

			if($(id))
			{
				this.bubbleContent.adopt($(id).clone());
			}
			this.bubbleContent.removeClass('loading');
		}
		else if(href.test('.gif|.jpeg|.jpg|.png|.png'))
		{
			var image = new Image();
			image.src = href;
			image.onload = function(){
				
				this.bubbleContent.adopt(image.set('opacity', 0));
				var imageSize = image.getSize();
				
				var fn = function(){
					image.fade(0, 1);
				};
				
				this.resizeBubble(el, imageSize.y, imageSize.x, fn);
			}.bind(this);
		}
		else
		{
			new Request.HTML({
				onSuccess: function(){
					this.bubbleContent.removeClass('loading')
				}.bind(this),
				update: this.bubbleContent,
				url: href	
			}).send();
		}
	},
	
	hideBubble: function()
	{
		this.delay = (function(){
			//if(this.options.fade)
			var fx = this.bubbleContainer.retrieve('fxInstance');
			fx.start({
				marginTop: this.options.marginTop,
				opacity: 0
			}).chain(function(){
				//this.resetBubble();
				this.visible = false;
			}.bind(this));
		}.bind(this)).delay(this.options.hideDelay);
	},
	
	resetBubble: function()
	{
		this.bubbleContainer.setStyles({
			height: this.options.size.height + this.tipHeight + (this.options.contentMargin * 2),
			width: this.options.size.width + (this.options.contentMargin * 2)
		});

		this.bubble.setStyle('height', this.options.size.height + (this.options.contentMargin * 2));

		this.bubbleContent.setStyle('height', this.options.size.height).empty().addClass('loading');
	},
	
	resizeBubble: function(el, height, width, fn)
	{
		var coordinates = el.getCoordinates();

		// TODO add method to calculate the position
		var left = (coordinates.left + (coordinates.width/2).round() - (width/2).round()) - (this.options.contentMargin * 2);
		var top = (coordinates.top - height - this.tipHeight - this.options.marginBottom) - (this.options.contentMargin * 2);
		
		new Fx.Elements($$(this.bubbleContainer, this.bubble, this.bubbleContent), {
			onComplete: function(){
				this.bubble.setStyle('height', height + (this.options.contentMargin * 2));
				this.bubbleContent.setStyle('height', height).removeClass('loading');
				fn();
			}.bind(this)
		}).start({
			'0': {
				height: height + this.tipHeight + (this.options.contentMargin * 2),
				left: left,
				top: top,
				width: width + (this.options.contentMargin * 2)
			},
			'1': {
				height: height + (this.options.contentMargin * 2)
			},
			'2': {
				height: height
			}
		});
	},
	
	showBubble: function(el)
	{
		this.clearDelay();

		var coordinates = el.getCoordinates();

		// TODO limit left 0, window.width
		var left = (coordinates.left + (coordinates.width/2).round() - (this.options.size.width/2).round()) - (this.options.contentMargin * 2);
		var top = (coordinates.top - this.options.size.height - this.tipHeight - this.options.marginBottom) - (this.options.contentMargin * 2);

		this.bubbleContainer.setStyles({
			left: left,
			top: top
		});

		this.getContent(el);
		
		if(this.visible)
		{
			return;
		}

		if(this.options.fade)
		{
			var fx = this.bubbleContainer.retrieve('fxInstance');
			fx.start({
				marginTop: [this.options.marginTop, 0],
				opacity: [0, 1]
			});
			this.visible = true;
		}
		else
		{
			this.bubbleContainer.fade('show');	
		}
	}
	
});