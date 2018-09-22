var express = require('express');
var router = express.Router();
var session = require('express-session');

var bodyParser = require('body-parser');
//var ngModel = require('ngModel');

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: false }));

router.use(session({secret: 'random string'}));

/*
* GET book collection
*/
router.get('/loadpage', function(req, res)
{ 
    //res.send({msg:'right connection'});
    var db = req.db;
    var num = req.numPerPage;
    var collection1 = db.get('bookCollection');
    var collection2 = db.get('userCollection');

    var cat = req.query.category;
    var pag = parseInt(req.query.page,10);

    //pageLower: the first book we need to display
    //pageUpper: the book after the last book we need to display
    var pageLower = num*(pag-1);
    var pageUpper = num*pag+1;

    if (cat=='nil'){
        cat = 'Computer';
    }

    //res.send({lower: pageLower, upper: pageUpper});

    

    var categories = [];
    collection1.distinct( "category" , function(err,docs){
        categories = docs;

        
        collection1.find({category: cat},
            {_id: 1, title: 1, authorList: 1, price: 1, coverImage: 1},function(err,docs){
            if (err == null||err==''){
                
                var numPages;

                collection1.count({category: cat},function(err,numDoc){

                    numPages = parseInt(Math.ceil(numDoc/num));
                    var userName = "undefined";
                    var totalNumCart = "undefined";

                    if (req.session.userId){
                        collection2.find({_id: req.session.userId},{name: 1, _id: 0},function(err,docsname){
                             if(err!=null&&err!=''){
                                res.json({msg:err});
                            } else {
                                userName = docsname[0].name;
                                collection2.find({_id: req.session.userId},{totalnum: 1, _id: 0},function(err,docstotalnum){
                                    if(err!=null&&err!=''){
                                        res.json({msg:err});
                                    } else {
                                        totalNumCart = docstotalnum[0].totalnum;
                                         var toReturn = {};
                                        toReturn["books"] = docs.slice(pageLower,pageUpper-1);
                                        toReturn["numPages"] = numPages;
                                        toReturn["userName"] = userName;
                                        toReturn["totalNumCart"] = totalNumCart;
                                        toReturn["categories"] = categories;
                                        //toReturn["pageLower"] = pageLower;
                                        //toReturn["pageUpper"] = pageUpper;
                                        res.json(toReturn);                                      
                                    }                  
                                });
                            }                  
                        });
                        
                    } else {
                       var toReturn = {};
                        toReturn["books"] = docs.slice(pageLower,pageUpper-1);
                        toReturn["numPages"] = numPages;
                        toReturn["userName"] = userName;
                        toReturn["totalNumCart"] = totalNumCart;
                        toReturn["categories"] = categories;
                        //toReturn["pageLower"] = pageLower;
                        //toReturn["pageUpper"] = pageUpper;
                        res.json(toReturn);
                    }


                    });

            }
            else res.send({msg: err});
        });
        

        //res.send({msg1: categories, msg2: cat});
    });

        

});

/*
* GET book
*/
router.get('/loadbook/:bookid', function(req, res)
{ 
    var db = req.db;
    var collection = db.get('bookCollection');
    var bookid = parseInt(req.params.bookid);

    //res.send({bookId: bookid});
    collection.find({bookId: bookid},{publisher: 1,date: 1,description:1,bookId: 1,_id:0},function(err,docs){
        if (err == null||err=='')
            res.json(docs);
        else res.send({msg: err});
    });
});

/*
* POST signin
*/
router.post('/signin', function(req, res)
{ 
    var db = req.db;
    var collection = db.get('userCollection');

    var user = req.body.username;
    var pass = req.body.password;
    //res.send({msg: user,msg1:pass});


    collection.find({name: user,password: pass},{_id: 1,totalnum: 1},function(err,docs){
        if (err === null && docs!=null){

            req.session.userId = docs[0]._id;
                collection.update({_id:docs[0]._id},{$set: {status:"Online"}});
                res.send({msg: docs[0].totalnum});
        }
        else res.send({msg: "Login failure"});
    });
    
});

/*
* GET signout
*/
router.get('/signout', function(req, res)
{ 
    var db = req.db;
    var collection = db.get('userCollection');
    var id = req.session.userId;
    req.session.userId = null;

    collection.update({_id: id},{$set: {status:"Offline"}},function(err,docs){
        if (err == null || err==''){
            res.send({msg: ""});
        }
        else res.send({msg: err});
    });
});

/*
* PUT addtocart
*/
router.put('/addtocart', function(req, res)
{ 
    var db = req.db;
    var collection = db.get('userCollection');

    var bookToUpdate = req.body.bookId;
    var newQuantity = parseInt(req.body.quantity);
    var userToUpdate = req.session.userId;

    //TO DO: update status of the commodity in commodities collection, according to
    //commodityToUpdate and newStatus

    var cartArray;

    collection.find({_id:userToUpdate},{cart: 1, _id: 0},function(err,resultCart){
        cartArray = resultCart[0].cart;
        //res.json({cart: cartArray});

        var index = -1;

        for (var i=0; i<cartArray.length; i++){
            if (cartArray[i].bookId==bookToUpdate){
                index = i;
            }
        }
        //res.send({cart: index});

        if (index==-1){
            var toAdd = {"bookId":bookToUpdate,"quantity":newQuantity};
            cartArray.push(toAdd);
            collection.update({_id:userToUpdate},{$push: {cart: toAdd}},function(err,result){
                if (err!=null && err!=''){
                    res.send({msg:err});
                }          
            });
        }else{
            var finalQuantity = cartArray[index].quantity + newQuantity;
            var finalElement = {"bookId":bookToUpdate,"quantity":finalQuantity};
            collection.update({_id:userToUpdate,cart:cartArray[index]},{$set: {"cart.$": finalElement}},function(err,result){
                if (err!=null && err!=''){
                    res.send({msg:err});
                }          
            });
        }

        var totalNumCart;

        collection.find({_id:userToUpdate},{_id: 0,totalnum:1},function(err,resultNum){
            totalNumCart = resultNum[0].totalnum;
            //res.send({totalnum:totalNumCart});

            collection.update({_id:userToUpdate},{$set: {totalnum: totalNumCart + newQuantity}},function(err,result){
                if (err!=null && err!=''){
                    res.send({msg:err});
                }          
            });

            var totalPrice = 0;
            var prices = []
            var collection2 = req.db.get("bookCollection");


            var targetPrice;
            //res.send({totalnum:totalNumCart});

            var bookidArray = []
            for (var i=0; i<cartArray.length; i++){
                bookidArray.push(cartArray[i].bookId);
            }

            //res.send({totalnum:totalNumCart});


            collection2.find({bookId:{$in: bookidArray}},{_id:0,price:1},function(err,resultPrice){

                if (err!=null && err!=''){
                    res.send({msg: err});
                }

                //res.json(resultPrice);

                for (var i=0; i<resultPrice.length; i++){
                    targetPrice = parseInt(resultPrice[0].price.substring(1));
                    totalPrice += targetPrice*cartArray[i].quantity;
                    //console.log(targetPrice*cartArray[i].quantity);
                    //totalPrice += targetPrice*cartArray[i].quantity;                   
                }

                res.send({totalnum:totalNumCart+newQuantity,totalprice:totalPrice});
            });

        });



    });

});

/*
* GET loadcart
*/
router.get('/loadcart', function(req, res)
{ 
    var db = req.db;
    var collection = db.get('userCollection');
    var id = req.session.userId;

    var collection2 = db.get("bookCollection");

    var toSendBack = {};
    var totalNumCart;

    collection.find({_id:id},{_id: 0,totalnum:1},function(err,resultNum){
        totalNumCart = resultNum[0].totalnum;
        toSendBack["totalnum"] = totalNumCart;
        toSendBack["cart"] = [];

        //res.send({totalnum: totalNumCart});
        collection.find({_id:id},{_id: 0,cart:1},function(err,resultCart){
            if (err!=null&&err!='') res.send({msg:err});
            else {
                var cartArray = resultCart[0].cart;

                 var bookidArray = []
                for (var i=0; i<cartArray.length; i++){
                    bookidArray.push(cartArray[i].bookId);
                }

                //res.json(bookidArray);
                    collection2.find({bookId:{$in: bookidArray}},{_id:0,title:1,authorList:1,price:1,coverImage:1,bookId:1},function(err,result){

                        for (var i=0; i<result.length; i++){
                            var element = {"bookId":result[i].bookId,"quantity":parseInt(cartArray[i].quantity),"title":result[i].title,"authorList":result[i].authorList,"price":result[i].price,"coverImage":result[i].coverImage};
                            toSendBack["cart"].push(element);
                        }
                        res.json(toSendBack);  

                    });             
            }
        });

    

    });

 
});

/*
* PUT updatecart
*/
router.put('/updatecart', function(req, res)
{ 
    var db = req.db;
    var collection = db.get('userCollection');
    var userid = req.session.userId;
    var bookid = req.body.bookId;
    var quant = parseInt(req.body.quantity);

    collection.find({_id:userid},{cart: 1, _id: 0},function(err,resultCart){

        var cartArray = resultCart[0].cart;

        var index = -1;

        for (var i=0; i<cartArray.length; i++){
            if (cartArray[i].bookId==bookid){
                index = i;
            }
        }

        var oldQuant = cartArray[index].quantity;

        var finalElement = {"bookId":bookid,"quantity":quant};
        collection.update({_id:userid,cart:cartArray[index]},{$set: {"cart.$": finalElement}},function(err,result){
            if (err!=null&&err!=''){
                res.send({msg:err});
            }          
        });

        collection.find({_id:userid},{_id:0,totalnum:1},function(err,resultNum){
            var totalNumCart = resultNum[0].totalnum;
            collection.update({_id:userid},{$set: {totalnum: totalNumCart + quant - oldQuant}},function(err,result){
                if (err!=null&&err!=''){
                    res.send({msg:err});
                }else{
                    res.send({msg:totalNumCart+quant-oldQuant});
                }          
            });   
        });


    });
 
});

/*
* DELETE to delete a book from a cart
*/
router.delete('/deletefromcart/:bookid', function(req, res) {
    var bookid = req.params.bookid;
    var db = req.db;
    var collection = db.get('userCollection');
    var userid = req.session.userId;

    var targetCart;
    var quant;
    collection.find({_id:userid},{_id:0,cart:1},function(err,resultCart){
        targetCart = resultCart[0];
         for (var i=0; i<targetCart.cart.length; i++){
            if (targetCart.cart[i].bookId==bookid){
                quant = targetCart.cart[i].quantity;
                break;
            }
        }

        var targetDoc = {"bookId":bookid,"quantity":quant};

        collection.update({_id:userid},{ $pull: { cart: { $in: [ targetDoc ] } } },
        { multi: false },function(err,result){
            if (err!=null){
                res.send({msg:err});
            }
        });

       collection.find({_id:userid},{_id:0,totalnum:1},function(err,resultNum){
            var totalNumCart = resultNum[0].totalnum;
            collection.update({_id:userid},{$set: {totalnum: totalNumCart - quant}},function(err,result){
                if (err!=null&&err!=''){
                    res.send({msg:err});
                }else{
                    res.send({msg:totalNumCart-quant});
                }          
            });   
        });
    });
 
});

/*
* GET to checkout
*/
router.get('/checkout', function(req, res) {
    var id = req.session.userId;
    var db = req.db;
    var collection = db.get('userCollection');

    collection.update({_id:id},{$set: { totalnum: 0 , cart:[] }},function(err, result){
        res.send(
        (err == null || err == '') ? { msg: '' } : { msg: err }
        );
    });
});

module.exports = router;
