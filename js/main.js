window.HomeView = Backbone.View.extend({

    template:_.template($('#home').html()),

    render:function (eventName) {
        $(this.el).html(this.template());
        return this;
    }
});

window.newSearchView = Backbone.View.extend({

    template:_.template($('#newSearch').html()),

    render:function (eventName) {
        $(this.el).html(this.template());
        return this;
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
    
var AppRouter = Backbone.Router.extend({

    routes:{
        "":"home",
        "newSearch":"newSearch",
        "newList":"newList",
        "savedRecipes":"savedRecipes",
        "oldList":"oldList"
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
});