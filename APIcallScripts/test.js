(function($){
  Backbone.sync = function(method, model, success, error){ 
    success();
  }
  
  //Item is a single recipe, with a name(**pending**) and an array of ingredients
  var Item = Backbone.Model.extend({
    defaults: {
      part1: 'hello',
      part2: 'world'
    },  
    initialize: function(){
      if( !this.get('ingrs') ){ 
        this.set({ingrs: new Array()});
      }
    },
    getIngrs: function(){
      return(ingrs);
    }
  });
  
  var List = Backbone.Collection.extend({
    model:Item,
    url: "http://api.yummly.com/v1/api/recipes?_app_id=d8087d51&_app_key=005af5a16f1a8abf63660c2c784ab65f&q=onion%20soup",
    
    //used to be getIngr
    initialize: function(){
    	console.log("collection created");
    },
    getRecipes: function(query){
      console.log("listView getIngr called");

      $.ajax({
	//append a query to the end of the url
	//&q=onion%20soup
	url: function() {
	  return 'http://api.yummly.com/v1/api/recipes?_app_id=d8087d51&_app_key=005af5a16f1a8abf63660c2c784ab65f&maxResult=5'+query;
	},
	dataType: 'jsonp',
	success: function(apiStuff){
	    
	    var result = new Array();
	    result = apiStuff;
	    result = result.matches;
	    console.log("starting getIngr");
	    
	    $.each(result, function(i, item) {
		console.log("this is a new recipe-");
		var temp = new Array();
		temp = result[i].ingredients;
		otherTemp = result[i].id;
		listView.addItem(otherTemp);
		/* log every ingredient, disabled b/c annoying
		$.each(temp, function(j, items) {
		  console.log(temp[j]);
		});*/
		console.log(result[i].ingredients);
	    });
	}  
      });
    },
  });
  
  var ItemView = Backbone.View.extend({
    tagName: 'li',
    events: {
        'click span.choose': 'openRecipe'
    },
    initialize: function(){
        _.bindAll(this, 'render', 'unrender', 'remove', 'openRecipe');
        this.model.bind('change', this.render);
        this.model.bind('remove', this.unrender);
    },
    render: function(){
        $(this.el).html('<span style="color:black;">'+this.model.get('part1')+' '+this.model.get('part2')+'</span> &nbsp; &nbsp; <span> <input type="checkbox">done</span> &nbsp; &nbsp; <span class="choose" style="cursor:pointer; color:red; font-family:sans-serif;">[choose]</span>');
        return this;
    },
    unrender: function(){
        $(this.el).remove();
    },
    remove: function(){
        this.model.destroy();
    },
    openRecipe: function(){
      console.log("openRecipe called");
      console.log(this.model.get);
      var ingrTemp = new Array();
      
      ingrTemp = this.model.get(ingrs);
      $.each(ingrTemp, function(i, item) {
         console.log(ingrTemp[i]);
      });
    }
  });
  
  var ListView = Backbone.View.extend({    
    el: $('body'), 
    events: {
      'click button#add': 'recipeSearch'//this should be changed so that it sends the attribute?  also this needs an input field
    },
    initialize: function(){
        _.bindAll(this, 'render', 'addItem', 'appendItem', 'recipeSearch');
        
        this.collection = new List();
        this.collection.bind('add', this.appendItem);
        
        this.counter = 0;
        this.render(); 
    },
    render: function(){
    //should rework this to use templates
        var self = this;
	$(this.el).append("<button id='add'>Add list item</button>");
        $(this.el).append("<input id='searchbox' type='text'>");
	$(this.el).append("<ul></ul>");
        _(this.collection.models).each(function(item){
            self.appendItem(item);
        }, this); /*this will be useful for recilist*/
    },
    addItem: function(name){
      this.counter++;
      var item = new Item();
      item.set({
        part1: this.counter+'-',
	part2: name
      });
      this.collection.add(item);
    },
    appendItem: function(item){
        var itemView = new ItemView({
            model: item
        });        
        $('ul', this.el).append(itemView.render().el);
    },
    recipeSearch: function(query){
    	console.log("recipeSearch called, about to do getRecipes on collection");
	var newQuery = "http://api.yummly.com/v1/api/recipes?_app_id=d8087d51&_app_key=005af5a16f1a8abf63660c2c784ab65f&q="+query.toString();
	console.log(newQuery);
	//this.collection.getRecipes(newQuery);
    }
});
    
    var listView = new ListView();

})(jQuery);
