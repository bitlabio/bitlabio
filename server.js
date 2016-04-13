var bitlab = {}
bitlab.version = 2

  /* 
    
      BITLAB.io   
      Webserver by Rouan van der Ende 

      TODO ––––––––––––––––––––––––––––––––––––––

      On first run have a set wizard. 
      Set admin password, hash it etc.
      
      INSTRUCTION –––––––––––––––––––––––––––––––
        
        Create a config.json file:
        {
          "secret" : "password"
        }


        Run using comand:

        # sudo node --harmony server.js
        
        or

        # sudo nodemon --harmony server.js


      DOCUMENTATION –––––––––––––––––––––––––––––

        https://nodejs.org/en/docs/es6/

                                                */
var config      = require('./config.json')
var express     = require('express');
var app         = express();
var path        = require("path");
var bodyParser  = require('body-parser');
var fs          = require('fs');
var multer      = require('multer')
var upload      = multer({ dest: 'uploads/' })
var mongojs     = require('mongojs')
var mkdirp      = require('mkdirp');

var _ = require('underscore')

var db          = mongojs('bitlab2',[
                  "posts",
                  "users",
                  "wallets",
                  "roles",
                  "roles_users",
                  "permissions",
                  "permissions_users",
                  "permissions_roles",
                  "settings",
                  "tags",
                  "posts_tags",
                  "permissions_apps",
                  "apps",
                  "app_settings",
                  "app_fields",
                  "mapnodes"
                  ])

var cookieParser = require('cookie-parser')
var session = require('cookie-session')

app.use(bodyParser.json());

app.use(session({
  name: 'session',
  keys: ['vsdfvdfs', 'asdfdfsa'],
  secureProxy: false // if you do SSL outside of node
}))

app.use('/', express.static('public')); //index.html default

var logger = function (req, res, next) {
  //console.log("req:"+req.url)
  next();
};


app.use(logger);




var users = function (req, res, next) {
  console.log(req.session.hash);   
  if (req.session.hash) {
    db.users.findOne({"sessionhash":req.session.hash}, function(err,dbuser) {
      if (dbuser == null) {
        //USER NOT RECOGNIZED (YET?) 
        console.log("invalid sessionhash!!");   
        delete req.session.hash
        newusers(req,res,next);
      } else {
        //USER RECOGNIZED
        delete req.session.new  //delete new flag (bug workaround)
        req.user = dbuser       //loads user data onto req
        console.log("ALIAS "+dbuser.alias+" REQUEST "+req.method+" "+req.url)
        next();
      }
    })
  } else {
    newusers(req,res,next);
  }

  
/*
  if (req.session.hash == null) {

    //AUTO REGISTRATION

    //if they dont have a session hash cookie yet then we create one for them.
    //now we can remember this user even if they dont register
    req.session.new   = true

    var user = {}
    user.sessionhash  = genRandomHex(64);
    req.session.hash  = user.sessionhash;

    user.alias        = "anon"+Math.round(Math.random()*999999);
    user.created      = Date.now()
    user.uniquehash   = genRandomHex(64); //THIS SHOULD NEVER CHANGE IN FUTURE
    user.lastseen     = user.created;

    makeWallet(user.uniquehash, (newwalletaddress) => {
      //THIS SHOULD NEVER CHANGE IN FUTURE. Private keys are stored in wallet database.
      user.walletaddress = newwalletaddress

      db.users.save(user, function (err,result) {
        console.log("new user.")
        delete req.session.new;
        next();
      })  

    }); 
    
    

  } */
  
}

app.use(users);

var newusers = function(req, res, next) {
  if (req.session.hash == undefined) {
    console.log("new user registration!")  
    //AUTO REGISTRATION

    var user = {}
    user.sessionhash  = genRandomHex(64);
    req.session.hash  = user.sessionhash;

    user.alias        = "anon"+Math.round(Math.random()*999999);
    user.created      = Date.now()
    user.uniquehash   = genRandomHex(64); //THIS SHOULD NEVER CHANGE IN FUTURE
    user.lastseen     = user.created;

    makeWallet(user.uniquehash, (newwalletaddress) => {
      //THIS SHOULD NEVER CHANGE IN FUTURE. Private keys are stored in wallet database.
      user.walletaddress = newwalletaddress

      db.users.save(user, function (err,result) {
        console.log("new user.")
        next();
      })  

    }); 

  } 
}



var genRandomHex = function (len) {
  var randomhex = ""
  while (randomhex.length < len) {
    var randomnum    = Math.round(Math.random()*9999999999999) 
    var randomnumhex = randomnum.toString(16)
    var a = Math.floor(Math.random()*randomnumhex.length)
    var b = Math.floor((randomnumhex.length - a)*Math.random())
    randomhex += randomnumhex.slice(a,b)
  }
  var finaltrim = randomhex.slice(0,len);
  return finaltrim
}

/* 
================================================================================
bitBLENDER */

var blender  = require("pusher.blender")
var workers = []
var webclients = []
var jobs = []
var io = require('socket.io')(3001);
var globalsocket = false;
io.on('connection', function (socket) {

  socket.on('bitblenderworkerconnect', function (worker) {
    worker.socketid = socket.id
    worker.workername = encodeURIComponent(worker.workername)
    worker.timestamp = Date.now()
    workers.push(worker);
    //console.log(worker)
    //socket.broadcast.emit('bitblenderworkerconnect', worker);
    socket.broadcast.emit('workers', workers);
    console.log("sent workers list")
  })

  socket.on('bitblenderwebconnect', function (web) {
    web.socketid = socket.id
    webclients.push(web)
    socket.emit('workers', workers)
    console.log("sent workers list")
  })

  socket.on('message', function (data) {
    console.log(data);
    socket.broadcast.emit('message', data);
  });


  socket.on('disconnect', function () { 
    console.log("node disconnected")
    console.log(socket.id)
    workersDisconnect(socket.id);
    webclientsDisconnect(socket.id);
    socket.broadcast.emit('workers', workers);
    globalsocket = socket.broadcast;
    console.log("sent workers list")
  });

});

function webclientsDisconnect(socketid) {
  //removes a webclient from the webclients array based on socket.id
  var wid = -1;
  for (var w in webclients) { if (webclients[w].socketid == socketid ) {
        wid = w;
      }
  }
  if (wid >= 0) { webclients.splice(wid,1) }
}

function workersDisconnect(socketid) {
  //removes a worker from the workers array based on socket.id
  var wid = -1;
  for (var w in workers) { if (workers[w].socketid == socketid ) {
        wid = w;
      }
  }
  if (wid >= 0) { workers.splice(wid,1) }
}

function parseBlend(filename)
{
    console.log("Opening file: ", filename);
    var file = blender.open(filename);

    console.log("File version: ", file.header.version);
    
    console.log("Reading meshes...");
    var meshes = file.getBlocks("Mesh");
    _.each(meshes, function (block) 
    {
        var obj = file.readObject(block.address);
        
        console.log("Mesh at 0x" + block.address, 
            "total vertices/faces/edges:",
            obj.totvert + "/" + obj.totface + "/" + obj.totedge);

        console.log("Object:");
        console.log(obj);
    });    
}

//parseBlend("data/unitCube-000.blend");


var jobs = []
var jobnum = 0

app.put('/bitblender/upload/:file', (req, res) => {
  jobnum++;
  var thisjobnum = Math.round(Math.random()*999999);

  var path = 'public/bitblender/'
  var folder = 'jobs/'+thisjobnum;

  mkdirp(path+folder, function (err) {
      if (err) console.error(err)
      else {
        console.log('pow!')

        var diskfile = fs.createWriteStream(path+folder+'/'+req.params.file)
        console.log("file upload!"+req.url)
        console.log(req.params)
        req.on('data', function (data) {
          //console.log(data.toString())
          diskfile.write(data)
        })
        req.on('end', function (data) {
          console.log("---- new job -----")
          console.log("done recieving file:" + req.params.file)
          
          var job = {}
          job.jobnum = thisjobnum
          job.file = req.params.file
          job.filepath = folder+'/'+req.params.file
          jobs.push(job)
          if (globalsocket != false) { globalsocket.emit('jobs', jobs); }

          res.end(job.filepath);
        })

      }
  });



})

app.get('/bitblender', (req, res) => {
  res.sendFile(path.join(__dirname+'/view/bitblender.html'));  
})

/* == BITCOIN STUFF ======================================================================== */

var makeWallet = function (ownerUniqueHash, cb) {
  var bitcoin = require("bitcoinjs-lib")
  var keyPair = bitcoin.ECPair.makeRandom()
  var wallet = {}
  wallet.privatekey = keyPair.toWIF();
  wallet.address = keyPair.getAddress()
  wallet.ownerUniqueHash = ownerUniqueHash;

  db.wallets.save(wallet, (err,result) => {
    if (err) { console.log("error!") } else {

      cb(wallet.address); //just return the public save part
    }
  })

}

var blockrCall = function(command, walletAddress, cb) {
  console.log("w:"+walletAddress)
  var http = require("http")
    var unspentdata = "";
    http.get({
          host: 'btc.blockr.io',
          path: '/api/v1/address/'+command+'/'+walletAddress
      }, function(response) {
          // Continuously update stream with data
          response.on('data', function(d) {
              unspentdata += d;
          });
          response.on('end', function() {
              // Data reception is done, do whatever with it!
              if (unspentdata[0] == "{") {
                var parsed = JSON.parse(unspentdata);
                cb(parsed)
              } else {
                console.log("blockr ERROR:")
              }
              
          });
      }).on('error', (e) => {
        console.error(e);
      });
}


app.put('/api/send', (req, res) => {
    //console.log("BITCOIN SEND")
    // fees:
    // 0.000050   ECONOMIC
    // 0.000150   NORMAL
    // 0.000500   PRIORITY
    var fee = 0.0001 

    //console.log(req.body)
    //console.log(req.user)
    var needed = parseFloat(req.body.amount) + fee
    //console.log("needed:"+needed)
    var inputs = []
    blockrCall("unspent", req.user.walletaddress, function (unspent) {
      //console.log("UNSPENT:")
      var available = 0
      for (var t in unspent.data.unspent) {
        if (needed > available) { 
          if (unspent.data.unspent[t].confirmations >= 1) { 
            inputs.push(unspent.data.unspent[t])
            available += parseFloat(unspent.data.unspent[t].amount)  
          }
        }
      }
      //console.log("INPUTS:")
      //console.log(inputs)

    // DO TX
    if (needed <= available) { 
      db.wallets.findOne({"ownerUniqueHash": req.user.uniquehash}, (err,result) => {
        //console.log(result)
        var bitcoin = require("bitcoinjs-lib")

        var key = bitcoin.ECPair.fromWIF(result.privatekey);
        var tx = new bitcoin.TransactionBuilder();

        for (var i in inputs) {
          tx.addInput(inputs[i].tx, inputs[i].n);  
        }
        
        tx.addOutput(req.body.destination, Math.round(req.body.amount*100000000))
        available -= req.body.amount

        //return change
        if (Math.round( (available - fee)*100000000) > 0) {
          
          tx.addOutput(req.user.walletaddress, Math.round( (available - fee)*100000000))
        }
        //done
        tx.sign(0, key);
        var txhex = tx.build().toHex()
        //console.log(tx.build().toHex());
        //console.log(txhex)

        var request = require("request")

        //console.log("TRANSMIT....")
        request.post({url:'https://blockchain.info/pushtx', form: {tx:txhex}}, function(err,httpResponse,body){ /* ... */ 
          console.log(req.body)
          //console.log("TRANSMITTED")
          //console.log(err)
          //console.log(httpResponse)
          //console.log(body.toString())
          var returnObj = {"status" : body.toString()}
          res.json(returnObj)
        })



        
      })
    }
      

      //console.log(unspent)
  })
    


})

/* - - - -  */

app.get('/admin', (req,res) => {
  req.session.hash = "a64b00e8e36fa32b4144b561749c32ac3ae22664ecaff815c7821936ad33ce21";
  res.end("done.")
})

var makeWithdrawal = function(ownerUniqueHash, destination, amount, cb) {

}

/* - - - -  */

app.get('/account', (req, res) => {
  res.sendFile(path.join(__dirname+'/view/account.html'));  
})

/* ========================================================================== */

app.get('/test', (req, res) => {
  console.log("visitor on test!")
  res.write("hello!")
  res.end()
})

app.get('/contact', (req, res) => {
  res.sendFile(path.join(__dirname+'/view/contact.html'));  
})





app.get('/view/:pid', (req, res) => {
  console.log(req.params)
  res.sendFile(path.join(__dirname+'/view/viewprop.html'));
})


app.get('/', (req,res) => {
  if (req.session.hash) {
    res.sendFile(path.join(__dirname+'/view/index.html'));
  } else {
    res.sendFile(path.join(__dirname+'/view/index.html'));
  }
  
})






app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname+'/view/login.html'));  
})

app.get('/logout', (req, res) => {
  delete req.session.hash;
  res.redirect('/');
})

app.get('/submit', (req, res) => {
  if (req.session.hash == lastlogin) {
    res.sendFile(path.join(__dirname+'/view/submit.html'));  
  } else {
    res.redirect("/login")
  }  
  
})

// API

// ENCRYPTION
var scrypt = require("./js/scrypt.js"); // modified https://github.com/tonyg/js-scrypt

var lasthash = ""; //last generated (could be malicious)
var lastlogin = ""; //last successful (retain!)

var https = require('https');



// BITCOIN API
// COPY of http://blockr.io/documentation/api
app.get('/api/blockr/*', (req,res) => {
  //http://btc.blockr.io/api/v1/address/balance/198aMn6ZYAczwrE5NvNTUMyJ5qkfy4g3Hi
  //this uses the blockr.io api
  //todo in future is run our own full node.  
  console.log(req.path)

  var a = "/api/blockr/".length
  var b = req.path.length - a

  var apicall = req.path.slice(a,req.path.length);
  console.log(apicall)

    var http = require("http")
      var blockchaindata = "";
     http.get({
          host: 'btc.blockr.io',
          path: '/api/v1/'+apicall
      }, function(response) {
          // Continuously update stream with data
          response.on('data', function(d) {
              blockchaindata += d;
          });
          response.on('end', function() {
              // Data reception is done, do whatever with it!
              if (blockchaindata[0] == "{") {
                var parsed = JSON.parse(blockchaindata);
                console.log(parsed)
                res.end(blockchaindata)
              } else {
                console.log("blockr ERROR:")
                console.log(blockchaindata)
              }
              
          });
      }).on('error', (e) => {
        console.error(e);
        res.json(e)
      });
});



/*
//this calls blockchain.info api for bitcoin wallet data
app.get('/api/rawaddr/:addr', (req,res) => {
  //THIS FAILS OFTEN!

  
  //console.log(req.params)
      var blockchaindata = "";
     https.get({
          host: 'blockchain.info',
          path: '/rawaddr/'+req.params.addr
      }, function(response) {
          // Continuously update stream with data
          response.on('data', function(d) {
              blockchaindata += d;
          });
          response.on('end', function() {
              // Data reception is done, do whatever with it!
              if (blockchaindata[0] == "{") {
                var parsed = JSON.parse(blockchaindata);
                console.log(parsed)
                res.end(blockchaindata)
              } else {
                console.log("blockchaindata ERROR:")
                console.log(blockchaindata)
              }
              
          });
      }).on('error', (e) => {
        console.error(e);
        res.json(e)
      });
});
*/

app.get('/api/user', (req,res) => {
  var apiuser = {}
  apiuser.alias = req.user.alias
  apiuser.walletaddress = req.user.walletaddress
  res.json(apiuser)
});

app.put('/api/user', (req,res) => {
  console.log("user change")
  console.log(req.body)

  db.users.findOne({"sessionhash": req.user.sessionhash}, (err,dbuser) => {
    console.log(dbuser)
    if (req.body.alias) { if ((req.body.alias.length > 3 )&&(req.body.alias.length <15 )) {
      //TODO security on funny aliases.
      dbuser.alias = req.body.alias;
      db.users.update({"sessionhash": req.user.sessionhash}, dbuser, (err,dbupdateresult) => {
        console.log(dbupdateresult)
      })
    }}
  })
  

  res.json(req.user)
});



app.get('/api/delete', (req,res) => {
  if (req.session.hash == lastlogin) {
    var url = req.get('Referrer')
    var pid = parseInt(url.split('/').pop())
    db.properties.remove({"pid":pid}, (err, result) => {
      res.json(result)
    })
  } else {
    console.log("ERROR DELETE")
  }
})

app.post('/api/login', (req, res) => {
  console.log(req.body)
  if (req.body.request == "salt") { 
    var newsalt = Math.round(Math.random()*10000000000000000).toString(); console.log("salt:"+newsalt)
    var encryptedhex = scrypt.to_hex(scrypt.crypto_scrypt(scrypt.encode_utf8(config.secret), scrypt.encode_utf8(newsalt), 16384, 8, 1, 32)); 
    lasthash = encryptedhex; console.log("expected:"+encryptedhex);
    res.end( newsalt ); 
  }
  if (req.body.request == "login") { 
    if (req.body.hash == lasthash) {
      console.log("SUCCESSFUL")
      lastlogin = lasthash;

      req.session.hash = lastlogin;
      req.sessionOptions.maxAge = req.session.maxAge || req.sessionOptions.maxAge;

      res.end("success")

    } else {
      res.end("error")
    }
  }
  //res.end("hello")
})

app.get('/api/checklogin', (req, res) => {
  if (req.session.hash == lastlogin) {
    res.json({"login":"success"})
  } else {
    res.json({"login":"fail"})
  }
})

app.get('/api/search', (req, res) => { db.posts.find({}, (err, result) => {  res.json(result) }) })
app.get('/api/tags', (req, res) => { db.tags.find({}, (err, result) => {  res.json(result) }) })
app.get('/api/posts_tags', (req, res) => { db.posts_tags.find({}, (err, result) => {  res.json(result) }) })
//app.get('/api/search', (req, res) => { db.posts.find( (err, result) => {  res.json(result) }) })

app.get('/api/findone', (req, res) => {
  var url = req.get('Referrer')
  var slug = url.split('/').pop()
  console.log("api slug:"+slug)
  db.posts.findOne({"slug":slug}, (err, post) => {
    //console.log(post);
    res.json(post);
  })
})

app.post('/api/submit', (req, res) => {
  req.body.pid = Date.now();
  db.properties.save(req.body);
  res.json(req.body.pid);
})

var cpUpload = upload.fields([{ name: 'file', maxCount: 1 }, { name: 'gallery', maxCount: 8 }])
  app.post('/fileupload', cpUpload,  (req, res) => {
  console.log(req.files)
  var url = req.get('Referrer')
  var pid = url.split('/').pop()

  //UPLOAD/DB MAIN IMAGE
  fs.rename(req.files.file[0].path, "public/content/"+pid+".jpg", function() {
    db.properties.findOne({"pid":parseInt(pid)}, (err, dbprop) => {
      console.log(dbprop)
      dbprop.mainimg = pid+".jpg"
      
      db.properties.update({"pid":parseInt(pid)}, dbprop, (err, result) => {
        console.log("updated!")
        res.end("test");
      });
      

    })
  })


  
})

app.use('/newgame' ,(req, res) => {
  var newGame = {}
  newGame.id = Math.round(Math.random()*100000)
  newGame.status = "created"

  gameData[newGame.id] = newGame;

  res.redirect('/game/'+newGame.id+"/");
  //res.sendFile(path.join(__dirname+'/view/newgame.html'));
})

app.use('/game/:id/:options' ,(req, res) => {

  console.log(gameData);
  console.log(req.params)
  gameData[req.params.id].status = "started";

  res.redirect('/game/'+req.params.id+"/");

})

app.use('/p/:id/' ,(req, res) => {
  console.log(req.params.id);
  res.sendFile(path.join(__dirname+'/view/viewprop.html'));  
})

app.get('/:slug', function (req,res,next) {
  var slug = req.params.slug;
  console.log(req.params)
  db.posts.findOne({"slug":slug}, function (err, post) {
    if (post == null) {

      res.status(404);
      

      // respond with html page
        if (req.accepts('html')) {
          res.sendFile(path.join(__dirname+'/view/404.html'));
          return;
        }

        // respond with json
        if (req.accepts('json')) {
          res.send({ error: 'Not found' });
          return;
        }

        // default to plain-text. send()
        res.type('txt').send('Not found');



    } else {
      res.sendFile(path.join(__dirname+'/view/viewpost.html'));  
    }
    
  })
})


app.listen(80, function () {
  console.log('Bitlab.io listening...');
});






