var book_app = angular.module('FunBookApp', []);
//book_app.require('ngModel');

book_app.controller('FunBookController', function($scope, $http){

    //to be completed
    $scope.user = '';
    $scope.loggedIn = false;
    $scope.categories = [];
    $scope.books = [];
    $scope.cart = [];
    $scope.cartNum = 0;
    $scope.totalPrice = 0;
    $scope.currentPage = 1;
    $scope.numPage = 0;

    $scope.currentBook = {};

    $scope.bookInfo = false;
    
    $scope.toSignIn = false;
    $scope.loginFail = false;
    $scope.toSignOut = false;
    $scope.toAddToCart = false;
    $scope.addedToCart = false;
    $scope.viewCart = false;
    $scope.checkedOut = false;

    $scope.cat = "nil"

    $scope.range = function(n) {
        return new Array(n);
    };

    $scope.part = function(l){
        return l.slice(0,2);
    }

    $scope.loadpage = function(){
        console.log('cat: '+$scope.cat+' page: '+$scope.currentPage);         
        $http.get("/loadpage?category=" + $scope.cat + "&page=" + $scope.currentPage).then(function(response){    
            var returned = response.data;
            console.log(returned);

            $scope.books = returned.books;      
            $scope.categories = returned.categories;
            $scope.numPage = returned.numPages;
            $scope.user = returned.userName;

            if (returned.userName!="undefined"){
                $scope.loggedIn = true;
            }else{
                $scope.loggedIn = false;
            }  

            $scope.cartNum = returned.totalNumCart;

            }
            , function(response){             
                alert("Error loading page:"+response.statusText);         
            }); 
    }; 

    $scope.loadpageCat = function(cat){         
        $scope.cat = cat;
        $scope.currentPage = 1;
        $scope.loadpage();
    }; 

    $scope.loadpagePrev = function(){
        console.log($scope.currentPage);
        if ($scope.currentPage>1){
            $scope.currentPage -= 1;
            $scope.loadpage();
        }
    }

    $scope.loadpageNext = function(){
        console.log($scope.currentPage);
        if ($scope.currentPage<$scope.numPage){
            $scope.currentPage += 1;
            $scope.loadpage();
        }
    }

    $scope.loadbook = function(elem){
        $http.get("/loadbook/" + elem.bookId).then(function(response){    
            var returned = response.data;
            console.log(returned);

            $scope.currentBook.title = elem.title;
            $scope.currentBook.authorList = elem.authorList;
            $scope.currentBook.price = elem.price;
            $scope.currentBook.coverImage = elem.coverImage;

            $scope.currentBook.publisher = returned[0].publisher;
            $scope.currentBook.date = returned[0].date;
            $scope.currentBook.description = returned[0].description;
            $scope.currentBook.bookId = returned[0].bookId;
            
            $scope.bookInfo = true; 
            $scope.loginFail = false;
            $scope.toAddToCart = false;
            $scope.addedToCart = false;
            $scope.checkedOut = false;


            }
            , function(response){             
                alert("Error loading book:"+response.statusText);         
            }); 
    }

    $scope.goBack = function(){
        $scope.bookInfo = false;

        $scope.loginFail = false;
        $scope.toAddToCart = false;
        $scope.addedToCart = false;
        $scope.checkedOut = false;

        $scope.loadpage();
    }

    $scope.tosignin = function(){
        $scope.toSignIn = true;
    }

    $scope.signin = function(){
        var name = document.getElementById('name_input').value;
        var pass = document.getElementById('password_input').value;

        if (name!=''&&pass!=''){

           $http.post("/signin", {username: name,password: pass}).then(function(response){    
                var returned = response.data;
                console.log(returned);

                if(returned.msg=='Login failure'){
                    $scope.loginFail = true;
                } else {
                    $scope.loginFail = false;
                    $scope.cartNum = returned.msg;
                    $scope.loggedIn = true;
                    $scope.toSignIn = false;
                    //$scope.loadpage();
                    $scope.user = name;
                    if ($scope.toAddToCart){
                        console.log('will add to cart');
                        $scope.addToChart();
                    }
 
                }

                }
                , function(response){             
                    alert("Error loggin in:"+response.statusText);         
                });         
        } else {
            alert("You must enter username and password");
        }
    }

    $scope.tosignout = function(){
        $scope.toSignOut = true;
    }

    $scope.cancelSignOut = function(){
        $scope.toSignOut = false;
    }

    $scope.signout = function(){
        $http.get("/signout").then(function(response){    
            var returned = response.data;
            console.log(returned);
            
            if (returned.msg==''){
                $scope.loggedIn = false;
                $scope.toSignOut = false;
                if ($scope.viewCart || $scope.checkedOut){
                    $scope.viewCart = false;
                    $scope.checkedOut = false;
                    $scope.loadpage();
                } else if ($scope.addedToCart || $scope.bookInfo){
                    $scope.addedToCart = false;
                    $scope.bookInfo = true;
                }
            }         

            }
            , function(response){             
                alert("Error loading book:"+response.statusText);         
            });         
    }

    $scope.addToChart = function(){
        $scope.toAddToCart = true;
        if (!$scope.loggedIn){
            $scope.tosignin();
            return;
        }

        console.log('will put to server to add to cart');

        var number = document.getElementById('number_input').value;
        var id = $scope.currentBook.bookId;

        console.log('number: '+number+' bookId: '+id);
        //console.log($scope.currentBook);
         $http.put("/addtocart", {bookId: id,quantity: number}).then(function(response){    
            var returned = response.data;
            console.log(returned);
            
            $scope.addedToCart = true;   
            $scope.toSignIn = false;
            $scope.loginFail = false;
            $scope.checkedOut = false;

            $scope.cartNum = returned.totalnum;
            $scope.totalPrice = returned.totalprice;    

            }
            , function(response){             
                alert("Error loading book:"+response.statusText);         
            });                           
    
    }

    $scope.continueBrowsing = function(){
        $scope.addedToCart = false;
        if ($scope.checkedOut){
            $scope.checkedOut = false;
            $scope.cartNum = 0;
            $scope.cart = [];
        }
        
    }

    $scope.toViewCart = function(){

        $http.get("/loadcart").then(function(response){    
            var returned = response.data;
            console.log(returned);
            $scope.cartNum = returned.totalnum;

            $scope.cart = returned.cart;
            $scope.calculateTotalPrice();
            console.log($scope.cart);
  
            }
            , function(response){             
                alert("Error loading book:"+response.statusText);         
        }); 
          
        $scope.viewCart = true;       
        $scope.toSignIn = false;
        $scope.loginFail = false;
        $scope.toAddToCart = false;
        $scope.addedToCart = false;
        $scope.checkedOut = false;
    }

    $scope.calculateTotalPrice = function(){
        console.log($scope.cart);
        //$scope.cartNum = 0;
        $scope.totalPrice = 0;
        for (var i=0; i<$scope.cart.length; i++){
            $scope.totalPrice += parseInt($scope.cart[i].quantity) * parseInt($scope.cart[i].price.substring(1));
            //$scope.cartNum += parseInt($scope.cart[i].quantity);
        }
        
    }

    $scope.updateCart = function(c){
        if (c.quantity!=0){
            console.log(c);
             $http.put("/updatecart",{bookId: c.bookId,quantity: c.quantity}).then(function(response){    
                var returned = response.data;
                console.log(returned);
                $scope.cartNum = returned.msg;
                }
                , function(response){             
                    alert("Error updating cart:"+response.statusText);         
            });            
        } else {
             $http.delete("/deletefromcart/"+c.bookId).then(function(response){    
                var returned = response.data;
                console.log(returned);
                $scope.cartNum = returned.msg;
                }
                , function(response){             
                    alert("Error updating cart:"+response.statusText);         
            });            
        }
    }

    $scope.checkout = function(){
        if ($scope.cartNum>0){
              $http.get("/checkout").then(function(response){    
                var returned = response.data;
                console.log(returned);
                if (returned.msg==''){
                    $scope.checkedOut = true;
                    $scope.checkedNum = $scope.cartNum;
                    $scope.viewCart = false;
                    $scope.toSignIn = false;
                    $scope.loginFail = false;
                    $scope.toAddToCart = false;
                    $scope.addedToCart = false;
                    $scope.viewCart = false;
                    $scope.cartNum = 0;
                }
                }
                , function(response){             
                    alert("Error updating cart:"+response.statusText);         
            });            
        }
    }


});

