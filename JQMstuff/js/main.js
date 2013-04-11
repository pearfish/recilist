
 var Todo = Backbone.Model.extend({

    // Default attributes for the todo item.
    defaults: function(name) {
      return {
        title: name,
        order: Todos.nextOrder(),
        done: false
      };
    },

    
    // Toggle the `done` state of this todo item.
    toggle: function() {
      this.save({done: !this.get("done")}); 
    }

});

var TodoList = Backbone.Collection.extend({

    model: Todo,

    //!
    //!!!!
    //!!!!!!!
    //!!!!!!!!!!!
    // local storage is broken atm, will return later
    // localStorage: new Backbone.LocalStorage("todos-backbone"),
    
    done: function() {
      return this.where({done: true});
    },

    // Filter down the list to only todo items that are still not finished.   
    //   ?  is this needed ?
    remaining: function() {
      return this.without.apply(this, this.done());
    },
    nextOrder: function() {
      if (!this.length) return 1;
      return this.last().get('order') + 1;
    },
    comparator: 'order',
    
    
    // here's the fun part: querying the API 
    findRecipes: function(theQuery) {
      var query = theQuery; //placeholder
      console.log("findRecipes called");
      $.ajax({
	url: 'http://api.yummly.com/v1/api/recipes?_app_id=d8087d51&_app_key=005af5a16f1a8abf63660c2c784ab65f&maxResult=5&q='+query,
	dataType: 'jsonp',

	success: function(apiStuff){
	    var result = new Array();     
	    result = apiStuff;          //saves result as a new array
	    result = result.matches;    //now the array only has all the results
            
	    $.each(result, function(i, item) {
		var tempIngrArray = new Array();
		tempIngrArray = result[i].ingredients;
		tempRecipeName = result[i].recipeName;
		/*
		$.each(temp, function(j, items) {
		  console.log(temp[j]);
		});*/
		
                console.log(tempRecipeName);
		console.log(tempIngrArray); //only logs one ingr for now, too lazy
		/*
		$.each(tempIngrArray,function(j, items) {
		  console.log(tempIngrArray[j]);
		});
		*/
		anotherRecipe= new Todo(tempRecipeName);	
	    });
	}  
      });
    }
});

//I am afraid to move this
var Todos = new TodoList;


/*
 *  this view will be for the search results
 *  will be generated for each search result...obviously
 *  main distinuishing factor - will have an onlick event that will display all the ingredients
 *  AND will have a button that saves the recipe to the local storage

var newSearchView = Backbone.View.extend({
    tagName:"li",
    template: _.template($('#_______').html()),
    
    events: {
	"click : "showIngr",
    },
    
    initialize: function() {
	//!!
    },
    
    render: function() {
      this.$el.html(this.template(this.model.toJSON()));
      this.$el.toggleClass('done', this.model.get('done'));
    //  this.input = this.$('.edit');
      return this;
    },
    
});

*
*
*
*
*/

var TodoView = Backbone.View.extend({

    tagName:  "li",

    // Cache the template function for a single item.
    template: _.template($('#newSearch').html()),

    // The DOM events specific to an item.
    events: {
      "click .toggle"   : "toggleDone",
      "dblclick .view"  : "edit",
      "click a.destroy" : "clear",
      "keypress .edit"  : "updateOnEnter",
      "blur .edit"      : "close"
    },

    // The TodoView listens for changes to its model, re-rendering. Since there's
    // a one-to-one correspondence between a **Todo** and a **TodoView** in this
    // app, we set a direct reference on the model for convenience.
    initialize: function() {
      this.listenTo(this.model, 'change', this.render);
      this.listenTo(this.model, 'destroy', this.remove);
    },

    // Re-render the titles of the todo item.
    render: function() {
      this.$el.html(this.template(this.model.toJSON()));
      this.$el.toggleClass('done', this.model.get('done'));
      this.input = this.$('.edit');
      return this;
    },

    // Toggle the `"done"` state of the model.
    toggleDone: function() {
      this.model.toggle();
    },

    // Switch this view into `"editing"` mode, displaying the input field.
    edit: function() {
      this.$el.addClass("editing");
      this.input.focus();
    },

    // Close the `"editing"` mode, saving changes to the todo.
    close: function() {
      var value = this.input.val();
 
      if (!value) {
        this.clear();
      } else {
        this.model.save({title: value});
        this.$el.removeClass("editing");
      }
    },

    // If you hit `enter`, we're through editing the item.
    updateOnEnter: function(e) {
      if (e.keyCode == 13) this.close();
    },

    // Remove the item, destroy the model.
    clear: function() {
      this.model.destroy();
    }

});




window.HomeView = Backbone.View.extend({

    template:_.template($('#home').html()),

    render:function (eventName) {
        $(this.el).html(this.template());
        return this;
    }
});

window.newSearchView = Backbone.View.extend({

    template:_.template($('#newSearch').html()),
    
    events: {
      "keypress #recipe-search":  "searchOnEnter",
     /* "click #clear-completed": "clearCompleted",
      "click #toggle-all": "toggleAllComplete"*/
    },
    
    render:function (eventName) {
        $(this.el).html(this.template());
        return this;
    },
    
    searchOnEnter: function(e) {   //this will become the search bar
      if (e.keyCode != 13) return;
      var searchin = $("input[name='recipe-search']").val();
      
      console.log(searchin);
      searchTemp.findRecipes(searchin);
      
     
    }
});

window.newListView = Backbone.View.extend({

    template:_.template($('#newList').html()),

    render:function (eventName) {
        $(this.el).html(this.template());
        return this;
    }
});

window.savedRecipesView = Backbone.View.extend({

    template:_.template($('#savedRecipes').html()),

    //it should fetch all recipes from local storage and put them here
    
    render:function (eventName) {
        $(this.el).html(this.template());
        return this;
    }
});

window.oldListView = Backbone.View.extend({
    
    template:_.template($('#oldList').html()), 
    
    render: function (eventName) {
        $(this.el).html(this.template());
        return this;
    }
});    
   
window.deleteOldView =  Backbone.View.extend({
    
    template:_.template($('#deleteOld').html()), 
    
    render: function (eventName) {
        $(this.el).html(this.template());
        return this;
    }
}); 
    
var AppRouter = Backbone.Router.extend({

    routes:{
        "":"home",
        "newSearch":"newSearch",
        "newList":"newList",
        "savedRecipes":"savedRecipes",
        "oldList":"oldList",
	"deleteOld":"deleteOld"
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
        console.log('#home');
        this.changePage(new HomeView());
    },

    newSearch:function () {
        console.log('#newSearch');
        this.changePage(new newSearchView());
    },

    newList:function () {
        console.log('#newList');
        this.changePage(new newListView());
    },
    
    savedRecipes:function () {
        console.log('#savedRecipes');    
        this.changePage(new savedRecipesView());      
    },
    
    oldList:function () {
        console.log('#oldList');
        this.changePage(new oldListView());
    },
    
    deleteOld:function () {
        console.log('#deleteOld');
        this.changePage(new deleteOldView());
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
    searchTemp = new TodoList(); //this stores searched recipes
});