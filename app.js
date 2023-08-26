const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const app = express();
const http = require('http').Server(app);


const url = "mongodb://127.0.0.1:27017/hozoor_main";

app.use(bodyParser.urlencoded({extended: false}));

mongoose.connect(url, {useUnifiedTopology: true, useNewUrlParser: true, useCreateIndex: true}, function (e) {
    if (!e)console.log("connect");
    else console.log("not connected");
});

const Schema = mongoose.Schema;
const modelSchema = new Schema({
    Rooz: String,
    AlirezaGholami: String,
    AlirezaHamidi: String,
    AliSalehi: String,
    BitaRahmani: String,
    HosseinHosseini: String,
    HoseeinShokohnia: String,
    MoeinKhavari: String,
    SaraTabrizi: String,
    Type: Boolean
});
const nameModelSchema = new Schema({
    Name: String,
    secureCode: Number
});
const Hozoor = mongoose.model('ListHozoor', modelSchema);
const Names = mongoose.model('Listnames', nameModelSchema);

app.post('/register', function (req, res) {
    const secureCode = req.body.secureCode;
    Names.findOne({secureCode: secureCode}, function (error, user) {
        if (user) {
            let number = Math.floor(Math.random() * (10000 - 1000)) + 1000;
            let token = jwt.sign({secureCode: number}, 'aql1iur2eez3aeg4hno5loa6mfi71m988y992h0!1e2@a#r$t%');
            Names.updateOne({Name: user.Name}, {$set: {secureCode: number}}, function (error, update) {
                if (update) {
                    res.send({status: "ok", token: token});
                }
            });
        }
    });
});


app.post('/check_in_out', function (req, res) {
    const token = req.headers['x-access-token'];
    const type = req.body.type;
    const rooz = new Date().toISOString().replace('-', '/').split('T')[0].replace('-', '/');
    const date = new Date();

    jwt.verify(token, 'aql1iur2eez3aeg4hno5loa6mfi71m988y992h0!1e2@a#r$t%', function (error, decode) {
        if (error) {
            res.send({status: "error"});
        } else {
            //if token was legit
            Names.findOne({secureCode: decode.secureCode}, function (error, user) {
                //if token's field is legit
                if (user) {
                    const fullName = user.Name;
                    Hozoor.findOne({$and :[{Rooz : rooz},{Type : type}]},function (error,doc) {
                        //if someone already made that day document
                        if(doc){
                            Hozoor.findOne({$and :[{Rooz : rooz},{[fullName]: null},{Type : type}]},function (error,doc) {
                                //only works when that specific person has not checked in/out
                                if(doc){
                                    Hozoor.updateOne({_id:doc.id},{$set:{[fullName]:date}},function (error,update) {
                                        if(update){
                                            res.send({status: "ok"});
                                        }
                                    });
                                //if that person has checked in/out
                                }else{
                                    res.send({status: "already_checked"});
                                }
                            });
                        //if nobody has yet made that day document
                        }else{
                            const addUserData = new Hozoor({
                                Rooz:rooz,
                                [fullName]:date,
                                Type:type
                            });
                            addUserData.save(function (error,response) {
                                if(!error){
                                    res.send({status: "ok"});
                                }
                            });
                        }
                    });
                }
            });
        }
    });
});

app.post('/check_token',function (req,res) {
    const token = req.headers['x-access-token'];
    const rooz = new Date().toISOString().replace('-', '/').split('T')[0].replace('-', '/');
    jwt.verify(token, 'aql1iur2eez3aeg4hno5loa6mfi71m988y992h0!1e2@a#r$t%', function (error, decode) {
        if(!error){
            Names.findOne({secureCode: decode.secureCode}, function (error, user) {
                if (user) {
                    const fullName = user.Name;
                    Hozoor.findOne({$and :[{Rooz : rooz},{[fullName]:{ $ne: null }},{Type : true}]},function (error,document) {
                        if(document){
                            Hozoor.findOne({$and :[{Rooz : rooz},{[fullName]:{ $ne: null }},{Type : false}]},function (error,document) {
                                if(document){
                                    console.log("Fack");
                                    res.send({"name":fullName,"status" :"Already_Done"});
                                }else {
                                    res.send({"type":false ,"name":fullName,"status" :"false"});
                                }
                            });
                        }else {
                            res.send({"type":true ,"name":fullName,"status" :"true"});
                        }
                    });
                }
            });

        }
    });
});


//TODO idk why i have this
// function updateHozoor(Rooz,fullName,Type,Date){
//     Hozoor.findOne({$or :[{Rooz : Rooz},{Type : Type}]},function (error,doc) {
//         if(doc){
//             Hozoor.updateOne({id:doc.id},{$set:{[fullName]:Date}},function (error,update) {
//                 if(update){
//                     return true;
//                 }
//             })
//         }else{
//             const addUserData = new Hozoor({
//                 Rooz:Rooz,
//                 [fullName]:Date,
//                 Type:Type
//             });
//             addUserData.save(function (error,response) {
//                 if(!error){
//                     return true;
//                 }
//             });
//         }
//     });
// }

//INFO Only For First Time Use . To Create New Secure Codes For Everyone
/*app.get('/generate_new_secure_codes',function (req,res) {
    var number;
    number = Math.floor(Math.random() * (10000 - 1000) ) + 1000;
    const addUserData = new Names({
        Name:"SaraTabrizi",
        secureCode:number
    });
    addUserData.save(function (error,response) {
        if(!error){
            res.send({Message : "Done"});
        }
    });
});*/

http.listen(3000);