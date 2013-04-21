var Todo = Backbone.Model.extend({
    defaults: function() {
      return {
	id: 0,
	title: 'defaultname',
	imgUrl: 'defaultimageurl',
        order: searchTemp.nextOrder(),
        rating: 0,
        timeToMake: '',
        salty: 0,
        sour: 0,
        sweet: 0,
        bitter: 0,	
        isPerm: false,
	taggedForList: false
      };
    },		
    initialize: function(){
      if( !this.get('ingrs') ){ 
        this.set({ingrs: new Array()});
      }
    },
    saveModel: function() {
	this.set({isPerm: true});
	this.save();
    }
});

var TodoList = Backbone.Collection.extend({
  model: Todo,
  localStorage: new Backbone.LocalStorage("searchTemp"),
  initialize: function() {
  },
  nextOrder: function() {
    if (!this.length) return 1;
    return this.last().get('order') + 1;
  },
  comparator: 'order',
  taggedForList: function() {
    return this.where({taggedForList: true});
  },
  remaining: function() {
    return this.without.apply(this, this.taggedForList);
  },
  
  //function to reset the collection
  wipe: function() {
    this.reset();  //admittedly, this doesnt really need to be a function, but its easy to track the logic this way
    console.log("wipe() called, current state:");
    console.log(this.models);
  },
  //
  restore: function() {
    this.reset(this.fetch());
    console.log("collection restored, current state:");
  },
  extractIngrs: function() {
    savedTemp=this.fetch(); //want to only get things saved to local storage
    var allIngrs = new Array(); 
    var rawIngrs = searchTemp.pluck("ingrs");
    $.each(rawIngrs, function(i, item) {
        allIngrs = _.union(allIngrs, rawIngrs[i]);
    });
    return allIngrs;
  },
  findRecipes: function(theQuery) {
    console.log("findRecipes called");
    searchTemp.wipe();
    $.ajax({
      url: 'http://api.yummly.com/v1/api/recipes?_app_id=d8087d51&_app_key=005af5a16f1a8abf63660c2c784ab65f&maxResult=5&q='+theQuery,
      dataType: 'jsonp',
       complete:function(){
            $('[data-role="listview"]').listview(); //re-active all listview
        },
      success: function(apiStuff){
	var result = new Array();     
	result = apiStuff;          //saves the API's response as a new array
        result = result.matches;    //trims extra information from the json object, now only has information on the various recipes
	  
	$.each(result, function(i, item) {
	  var anotherRecipe= new Todo();    // makes a new model for each result
	  
	  anotherRecipe.set({
	    id: result[i].id,            //then sets the attributes
	    title: result[i].recipeName,	
	    ingrs: result[i].ingredients,
	    imgUrl: result[i].smallImageUrls,
            rating: result[i].rating,
            timeToMake: result[i].totalTimeInSeconds,
          });
          //not all recipes support flavor ratings, so error catching must be used to avoid setting null values
          try { anotherRecipe.set({ salty : result[i].flavors.salty }); } catch(e) {anotherRecipe.set({salty : "?"});}  //maybe replace the error condition to setting the flavor to '?'
          try { anotherRecipe.set({ sour: result[i].flavors.sour }); } catch(e) {anotherRecipe.set({sour : "?"});}
          try { anotherRecipe.set({ sweet: result[i].flavors.sweet }); } catch(e) {anotherRecipe.set({sweet : "?"});}
          try { anotherRecipe.set({ bitter: result[i].flavors.bitter }); } catch(e) {anotherRecipe.set({bitter : "?"});}

	  searchTemp.add(anotherRecipe);    //adds the model to the temporary     
	});
      }  //eventually, should add something that checks for an empty search result, appending some warning if that happens
    });
    // console.log("search done");
  }  
});

var ShopItem = Backbone.Model.extend({
    idAttribute:"_id", 
    defaults: function() {
        return {
            ingr : 'ingredient',
            done : false
        }
    },
    toggle: function() {
      this.save({done: !this.get("done")}); 
    }
});

var ShopList = Backbone.Collection.extend({
    localStorage: new Backbone.LocalStorage("grocery-list"),
    generate: function() {
	ingrs = searchTemp.extractIngrs();
        $.each(ingrs, function(i, item) {
            var aShopThing = new ShopItem;
            aShopThing.set({ ingr : ingrs[i] });
            shopList.add(aShopThing);
        });
    }
});
    
var Todos = new TodoList;	//I am afraid to move this, 95% sure its obsolete, though
/*
var savedRecipesView = Backbone.View.extend({
    tagName:  "li",
    initialize: function() {
        this.render();
        this.listenTo(this.model, 'change', this.render);
        this.listenTo(this.model, 'destroy', this.remove);
    },
    render: function() {
        var template = _.template( $("#list_item").html(), {} );
        this.$el.html( template );
        
        //this.$el.html(this.template(this.model.toJSON()));
        //this.$el.toggleClass('done', this.model.get('done'));
        //this.input = this.$('.edit');
        //return this;
        
    },
    events: {
        "click input[type=button]": "sendToGroceries"
    },
    sendToGroceries: function() {
        var temp = new Array();
        temp = this.toJSON();
        $.each(temp, function(i, item) {
            var shopItem = new ShopItem();    
            shopItem.set({ name: temp[i].title });
            shoppingList.add(shopItem); //use pluck [ingrs]
            shopItem.save();
        });    
    }
});
*/
window.HomeView = Backbone.View.extend({
    template:_.template($('#home').html()), 
    render:function (eventName) {
        $(this.el).html(this.template());
        return this;
    }
});

window.newSearchView = Backbone.View.extend({
    template:_.template($('#newSearch').html()),
    initialize: function() {
        console.log(searchTemp);
        searchTemp.wipe();
        searchTemp.bind('add', this.render, this);
    },
    render:function (eventName) {
        var temp = new Array();  // I think this line isnt doing anyting
        results = searchTemp.toJSON();
        var variables = {
            recipes: results
        };
        $(this.el).html(this.template());
        return this;
    },
    events: {
      "keypress #recipe-search":  "searchOnEnter",
      //add a listener to newSearch to change what's displaye don this list
    },
    searchOnEnter: function(e) {   //the search bar's functionality
      if (e.keyCode != 13) return;
      var searchin = $("input[id='recipe-search']").val();
      searchTemp.findRecipes(searchin);
    }
});

window.newListView = Backbone.View.extend({
    template : _.template($('#newList').html()),
    initialize: function() {
    },
    render:function (eventName) {
        recipe = this.model.toJSON();
        $(this.el).html(this.template());
        return this;
    },
    events: {
      "click #save-this":  "saveModel"
    },
    saveModel: function() {
	console.log("saveModel() called");
        this.model.saveModel();
        searchTemp.each(function (model) {
	    if(model.isPerm) {
		model.save();
	    }
	});
    }
});

window.savedRecipesView = Backbone.View.extend({
    template:_.template($('#savedRecipes').html()),
    initialize: function() {
	searchTemp.fetch();
    },
    render:function (data) {    
        results = searchTemp.toJSON();
        var variables = {
            results: results
        };
	$(this.el).html(this.template(variables));
        return this;
    }
});


window.oldListView = Backbone.View.extend({
    template:_.template($('#oldList').html()), 
    initialize: function() {
        //dont need to mess with searchTemp, it should be all set up by savedRecipesView    
    },
    render: function (data) {
        recipe = this.model.toJSON();
        $(this.el).html(this.template());
        return this;
        //$(this.el).html(this.template(variables));
    },
    events: {
      "click #instructions":  "gotoInstructions"
    },
    gotoInstructions: function() {
        //do this later
    }
});

  
window.deleteOldView =  Backbone.View.extend({
    template:_.template($('#deleteOld').html()), 
    render: function (eventName) {
        $(this.el).html(this.template());
        return this;
    }
});

window.shoppingListView = Backbone.View.extend({
    template:_.template($('#shoppingList').html()),
    initialize: function() {
	shopList.generate();
        console.log(shopList);
    },
    render: function (eventName) {
	var variables = {
	  //in all honesty, I'm not really sure how the shop list is getting to the html
	};
	$(this.el).html(this.template(variables));
	return this;
    },
    toggleThis: function() {
        //this.toggle();    
    }
});


/*
window.listItemView = Backbone.View.extend({
    tagName: 'li',
    template:_.template($('#list-item').html()),
    initialize: function() {
        _.bindAll(this, 'render');
        this.model.bind('change', this.render);
        this.model.view = this;
    },
    events: {
        "click input[type=button]" : "onClick"
    },
    render: function() {
        $(this.el).html(this.template(this.model.toJSON()));
        this.setContent();
        return this;
    },
    onClick: function(){
        searchTemp.add(this.model);
        console.log("model added to searchTemp, current state of searchTemp:");
        console.log(searchTemp);
    }
});
*/ 
    
var AppRouter = Backbone.Router.extend({
    routes:{
        "":"home",
        "newSearch":"newSearch",
        "newList/:id":"newList",
        "savedRecipes":"savedRecipes",
        "oldList/:id":"oldList",
	"deleteOld":"deleteOld",
	"shoppingList":"shoppingList"
    },
    initialize:function () {
        // Handle back button throughout the application
        $('.back').live('click', function(event) {
            window.history.back();
            return false;
        });
        this.firstPage = true;
    },
    home:function () {
        this.changePage(new HomeView());
    },
    newSearch:function () {
        this.changePage(new newSearchView());
    },
    newList:function (theID) {
        var tempModel = searchTemp.get(theID);
        this.changePage(new newListView({
            model: tempModel,
            id: theID
        }));
        //console.log(permStorage.taggedForList());
    },
    savedRecipes:function () {  
        this.changePage(new savedRecipesView());      
    },
    oldList:function (theID) {
        //searchTemp.restore();
        var tempModel = searchTemp.get(theID);
        this.changePage(new oldListView({
            model: tempModel,
            id: theID    
        }));
    },
    deleteOld:function () {
        this.changePage(new deleteOldView());
    },
    shoppingList:function () {
	this.changePage(new shoppingListView());
    },
    changePage:function (page) {
        $(page.el).attr('data-role', 'page');
        page.render();
        $('body').append($(page.el));
        var transition = $.mobile.defaultPageTransition;
        // We don't want to slide the first page
        if (this.firstPage) {
            transition = 'none';
            this.firstPage = false;
        }
        $.mobile.changePage($(page.el), {changeHash:false, transition: transition});
    }

});

$(document).ready(function () {
    console.log('document ready');
    app = new AppRouter();
    Backbone.history.start();
    searchTemp = new TodoList(); //this stores searched recipes, rename to myRecipes
    shopList = new ShopList();
});