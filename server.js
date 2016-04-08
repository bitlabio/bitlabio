  
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
var db          = mongojs('bitlab2',[
                  "posts",
                  "users",
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

/* bitBLENDER */

var workers = []
var webclients = []
var io = require('socket.io')(3001);

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




app.get('/bitblender', (req, res) => {
  res.sendFile(path.join(__dirname+'/public/bitblender.html'));  
})




app.get('/test', (req, res) => {
  console.log("visitor on test!")
  res.write("hello!")
  res.end()
})

app.get('/contact', (req, res) => {
  res.sendFile(path.join(__dirname+'/public/contact.html'));  
})





app.get('/view/:pid', (req, res) => {
  console.log(req.params)
  res.sendFile(path.join(__dirname+'/public/viewprop.html'));
})


app.get('/', (req,res) => {
  if (req.session.hash) {
    console.log("LOGGED IN")
    console.log(req.session.hash);
    res.sendFile(path.join(__dirname+'/public/index.html'));
  } else {
    console.log("anon")
    res.sendFile(path.join(__dirname+'/public/index.html'));
  }
  
})


app.use('/', express.static('public')); //index.html default



app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname+'/public/login.html'));  
})

app.get('/logout', (req, res) => {
  delete req.session.hash;
  res.redirect('/');
})

app.get('/submit', (req, res) => {
  if (req.session.hash == lastlogin) {
    res.sendFile(path.join(__dirname+'/public/submit.html'));  
  } else {
    res.redirect("/login")
  }  
  
})

// API

// ENCRYPTION
var scrypt = require("./js/scrypt.js"); // modified https://github.com/tonyg/js-scrypt

var lasthash = ""; //last generated (could be malicious)
var lastlogin = ""; //last successful (retain!)

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
  //res.sendFile(path.join(__dirname+'/public/newgame.html'));
})

app.use('/game/:id/:options' ,(req, res) => {

  console.log(gameData);
  console.log(req.params)
  gameData[req.params.id].status = "started";

  res.redirect('/game/'+req.params.id+"/");

})

app.use('/p/:id/' ,(req, res) => {
  console.log(req.params.id);
  res.sendFile(path.join(__dirname+'/public/viewprop.html'));  
})

app.get('/:slug', function (req,res,next) {
  var slug = req.params.slug;
  console.log(req.params)
  db.posts.findOne({"slug":slug}, function (err, post) {
    res.sendFile(path.join(__dirname+'/public/viewpost.html'));
  })
})


app.listen(80, function () {
  console.log('Bitlab.io listening...');
});






