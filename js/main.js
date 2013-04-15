var Todo = Backbone.Model.extend({
    defaults: function() {
      return {
	id: 0,
	title: 'defaultname',
	rid: 'defaultrecipeID',
	imgUrl: 'defaultimageurl',
        order: Todos.nextOrder(),
	
        done: false  //should remove this, 'done-ness' isn't needed on the model level, just on the ingredient level

        /* things to add to model -
         * some logic to track 'done-ness' of individual recipes
         * the link to the recipe instructions
         */
        
      };
    },		
    initialize: function(){
      if( !this.get('ingrs') ){ 
        this.set({ingrs: new Array()});
      }
    },
    // Toggle the `done` state of this todo item.
    // **not needed**
    toggle: function() {
      this.save({done: !this.get("done")}); 
    }
});


var TodoList = Backbone.Collection.extend({
  model: Todo,

  //			!!		 local storage is broken atm, will return later

  //localStorage: new Backbone.LocalStorage("recilist-backbone"),
  //is it (the library) out of date maybe?
  //see   http://stackoverflow.com/questions/10867467/backbone-local-storage-undefined-is-not-a-function
  initialize: function() {
    this.bind('add', this.onModelAdded, this );
  },
  
  onModelAdded: function(model, collection, options) {
    //this does the appending to the search list, called in findRecipes()
    $("#search-list").append("<li> <img src="+model.get("imgUrl")+"> <a href='#newList/"+model.get("id")+"' class='ui-link-inherit'>" + model.get("title") + "</a> </li>");
  },

  done: function() {
    //**not needed**
    return this.where({done: true});
  },

  // Filter down the list to only todo items that are still not finished.   
  //   **not needed**
  remaining: function() {
    return this.without.apply(this, this.done());
  },
  nextOrder: function() {
    if (!this.length) return 1;
    return this.last().get('order') + 1;
  },
  comparator: 'order',
  
  findRecipes: function(theQuery) {
    //should eventually add code to delete all models in searchTemp here (so list doesnt get huge if there's more than one search)
    
    console.log("findRecipes called");
    $.ajax({
      url: 'http://api.yummly.com/v1/api/recipes?_app_id=d8087d51&_app_key=005af5a16f1a8abf63660c2c784ab65f&maxResult=5&q='+theQuery,
      dataType: 'jsonp',

      success: function(apiStuff){
	var result = new Array();     
	result = apiStuff;          //saves the API's response as a new array
	result = result.matches;    //trims extra information from the json object, now only has information on the various recipes
	  
	$.each(result, function(i, item) {
	  var anotherRecipe= new Todo();    // makes a new model for each result
	  
	  anotherRecipe.set({
	    id: "result "+(i+1),            //then sets the attributes
	    title: result[i].recipeName,	
	    ingrs: result[i].ingredients,
	    rid: result[i].id,
	    imgUrl: result[i].smallImageUrls//(add more attributes here as needed)
	  });
	  
	  
	  searchTemp.add(anotherRecipe);    //adds the model to the temporary 
	    
	  console.log("added, current state of searchTemp is-");
	  console.log(searchTemp.models);    
	});
      }  //eventually, should add something that checks for an empty search result, appending some warning if that happens
    });
		
	
    
  }  
});

var Todos = new TodoList;	//I am afraid to move this

var TodoView = Backbone.View.extend({
    
    //Honestly, I dont think this is even remotely needed, I'm just afraid to delete it

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

    //do we really care about this?  it cant be changed unless you switch to a differnt
    //page, and it will re-render  when you change back
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
    //NOT NEEDED
    toggleDone: function() {
      this.model.toggle();
    },

    // Switch this view into `"editing"` mode, displaying the input field.
    //---NOT NEEDED
    edit: function() {
      this.$el.addClass("editing");
      this.input.focus();
    },

    // Close the `"editing"` mode, saving changes to the todo.
    //----NOT NEEDED
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
    
    //---NOT NEEDED
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
      //add a listener to newSearch to change what's displaye don this list
    },
    
    render:function (eventName) {
      //template:_.template($('#recipeListItem').html()),
      $(this.el).html(this.template());
      return this;
    },
    
    searchOnEnter: function(e) {   //the search bar's functionality
      if (e.keyCode != 13) return;
      var searchin = $("input[id='recipe-search']").val();
      
      console.log("searched for - "+ searchin);
      //this function is in todoList, does an API call and
      //adds a new model for each result (there will almost always be 5 results)
      searchTemp.findRecipes(searchin);
    }
});



window.newListView = Backbone.View.extend({
    template:_.template($('#newList').html()),

    events: {
      "click #save-this":  "saveModel"
    },
    
    render:function (eventName) {
	$(this.el).html(this.template());
        return this;
    },
    
    saveModel: function() {
	console.log("saveModel() called");
	
	
    }
});

window.savedRecipesView = Backbone.View.extend({
    template:_.template($('#savedRecipes').html()),
    //this should fetch all recipes from permanent collection
    //(local storage) and display them here - maybe assist this with
    //a 'return all' function in permStorage?
    
    render:function (eventName) {
        $(this.el).html(this.template());
        return this;
    }
});

window.oldListView = Backbone.View.extend({
    //very similar to newListView, only difference is that
    //well first obviously it will be reached through #savedRecipes
    //and second, instead of having a "save" button at the bottom,
    //it will have a "show instructions" button that will
    //follow a link to the recipe instructions provided by API
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
        "newList/:id":"newList",
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
        this.changePage(new HomeView());
    },
    newSearch:function () {
        this.changePage(new newSearchView());
    },
    newList:function (id) {
        this.changePage(new newListView());
	console.log("now going to try to populate a list of recipes for "+id);
    
	var tempModel = searchTemp.get(id); //makes an instance of the model, using the ID to find it
	var theIngrs = new Array();
	var theIngrs = tempModel.get("ingrs"); //pulls the ingredients out of the model
	
	//appends each ingredient to page as a list element
	$.each(theIngrs, function(i, item) { 
	  $("#ingr-list").append("<li data-role='listview' class='ui-li ui-li-static ui-btn-right-c'>" + theIngrs[i] + "</li>");  
	}); 
	
    },
    savedRecipes:function () {  
        this.changePage(new savedRecipesView());      
    },
    oldList:function () {
        this.changePage(new oldListView());
    },
    deleteOld:function () {
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
    permStorage = new TodoList();
});