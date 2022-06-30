//EXPRESS
const express = require('express')
const app = express();
const PORT = 8080;

// AUTHORIZATION & AUTHENTICATION
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

// DEPENDENCIAS
const { percentage } = require('./src/utils/percentage') 
const { normalizr } = require('./src/utils/normalizrChat')
// const { userLogged } = require("./utils/mdwSession");
const { TIEMPO_EXPIRACION } = require('./src/config/globals')
const {validatePass} = require('./src/utils/passValidator');
const {createHash} = require('./src/utils/hashGenerator')
const routes = require('./src/routes/routes')


// MIDDLEWARE
app.use(express.json()); 
app.use(express.urlencoded({extended:true}))
app.use(passport.initialize())
app.use(passport.session())

// VIEWS
app.set('view engine', 'ejs'); //se define extensión (motor de plantilla)
app.use(express.static(__dirname + "/public"));

//COOKIES - PERSISTENCIA MONGO
const session = require("express-session");
const cookieParser = require("cookie-parser");
// const MongoStore = require('connect-mongo');
app.use(cookieParser())
const advancedOptions = { useNewUrlParser: true , useUnifiedTopology: true }

app.use(session({
//store: MongoStore.create({ mongoUrl: 'mongodb://localhost/sesiones'}),
// store: MongoStore.create({ mongoUrl: 'mongodb+srv://test:1111@cluster0.cwmksz4.mongodb.net/?retryWrites=true&w=majority'}),
    secret: 'daira',
    resave: true,
    saveUninitialized: true,
    mongoOptions : advancedOptions,
    cookie: {
        httpOnly: false,
        secure: false,
        maxAge: parseInt(TIEMPO_EXPIRACION)
      }
    })
);

passport.use('login', new LocalStrategy(
    (username, password, callback) => {
        UserModel.findOne({ username: username }, (err, user) => {
            if (err) {
                return callback(err)
            }

            if (!user) {
                console.log('No se encontro usuario');
                return callback(null, false)
            }

            if(!validatePass(user, password)) {
                console.log('Invalid Password');
                return callback(null, false)
            }

            return callback(null, user)
        })
    }
))


passport.use('signup', new LocalStrategy(
    {passReqToCallback: true}, (req, username, password, callback) => {
        UserModel.findOne({ username: username }, (err, user) => {
            if (err) {
                console.log('Hay un error al registrarse');
                return callback(err)
            }

            if (user) {
                console.log('El usuario ya existe');
                return callback(null, false)
            }

            console.log(req.body);

            const newUser = {
                firstName: req.body.firstname,
                lastName: req.body.lastname,
                email: req.body.email,
                username: username,
                password: createHash(password)
            }

            console.log(newUser);


            UserModel.create(newUser, (err, userWithId) => {
                if (err) {
                    console.log('Hay un error al registrarse');
                    return callback(err)
                }

                console.log(userWithId);
                console.log('Registro de usuario satisfactoria');

                return callback(null, userWithId)
            })
        })
    }
))


passport.serializeUser((user, callback) => {
    callback(null, user._id)
})

passport.deserializeUser((id, callback) => {
    UserModel.findById(id, callback)
})

// DAOS
const { ProductoDaoArchivo } = require('./daos/productos/ProductosDaoArchivo');
let product = new ProductoDaoArchivo();

const { ChatDaoArchivo } = require('./daos/chat/ChatDaoArchivo');
let chat = new ChatDaoArchivo();


// WEB SOCKETS                
const { Server: HttpServer } = require('http');
const { Server: IOServer } = require('socket.io');

const httpServer = new HttpServer(app);
const io = new IOServer(httpServer);

//Productos WEB SOCKET 
io.on('connection', async(socket) => {
    const prod = await product.getAll().then( (obj) =>{
        socket.emit('products', obj);
    })
    socket.on('new-products', async data => {
        const saveObj = await product.save(data);
        io.sockets.emit('products', await product.getAll());
    })
})
//chat WEB SOCKET 
io.on('connection', async (socket) => {
    //envío chat normalizado
    const text = await chat.getAll().then( (obj) =>{ 
        const dataContainer = { id: 1, mensajes: [] };
        dataContainer.mensajes = obj;
        const chatNormalizr = normalizr(dataContainer)
        //console.log("Usuario conectado al Chat"); 
        socket.emit('text', chatNormalizr);
    })
    //guardo nuevo obj y envio % compresion
    socket.on('new-text', async data => {
        const saveObj = await chat.save(data);

        const dataContainer = { id: 1, mensajes: [] };
        dataContainer.mensajes = await chat.getAll();

        let dataNocomprimida = JSON.stringify(dataContainer).length;
        let dataNormalized = normalizr(dataContainer);
        let dataComprimida = JSON.stringify(dataNormalized).length;

        let compression = percentage(dataComprimida, dataNocomprimida);
        
        try {
            console.log("compression");
            console.log(compression);
            socket.emit("compression", compression);
          } catch (error) {
            console.log(error);
        }
        io.sockets.emit('text', chat.getAll());
    })
})

//*******************   ENDPOINTS   **********************

//  INDEX
app.get('/', routes.getRoot);

//  LOGIN
app.get('/login', routes.getLogin);
app.post('/login', passport.authenticate('login', { failureRedirect: '/faillogin' }), routes.postLogin);
app.get('/faillogin', routes.getFaillogin);

//  SIGNUP
app.get('/signup', routes.getSignup);
app.post('/signup', passport.authenticate('signup', { failureRedirect: '/failsignup' }), routes.postSignup);
app.get('/failsignup', routes.getFailsignup);

//  LOGOUT
app.get('/logout', routes.getLogout);


// PROFILE
app.get('/products', routes.getProducts);

app.get('/ruta-protegida', routes.checkAuthentication, (req, res) => {
    res.render('protected')
});

//  FAIL ROUTE
app.get('*', routes.failRoute);

/*
app.get('/', userLogged, async (req, res) =>{
    const prod = await product.getAll().then( (obj) =>{
        obj.length  > 0 ?  res.render('pages/index', {listExists: true, listNotExists: false,  name : req.session.user }) : res.render('pages/index', {listNotExists: true, listExists: false,  name : req.session.user}) ;
    })  
})

app.get("/login", (req, res) => {
    try {
        if (req.session.user) {
            res.redirect('/');
        }
        res.render('pages/log', {login : true, logout : false});
    } catch (error) {
        console.log(error);
    }
    
  });

  app.post('/login', (req, res) => {
    let username = req.body.user;
    req.session.user = username;
    req.session.logged = true;
    res.redirect('/');
})

app.get("/logout", (req, res) => {
    req.session.destroy((error) => {
      if (error) {
        res.send({ status: "Logout Error", body: error });
      }else {
        let name = req.body.user
        console.log(name);
        res.render('pages/log', { name , logout : true, login : false})
    }
    });
  });

//PRODUCTOS FAKER 
app.post('/productos-test', async (req, res, next) => {
    try {
        res.json(await product.popular(req.query.cant));
    } catch (error) {
        next(error);
    }
})

app.get('/productos-test', async (req, res, next) => {
    try {
        let products = product.getAll().then(obj => {
            res.json({allProducts: obj});       
        });   
    } catch (error) {
        next(error);
    }
})
*/
//*******************************************************
 

//SERVIDOR
const server = httpServer.listen(PORT, () =>{
    console.log('Servidor escuchando en el puerto '+ server.address().port);
})
server.on('error', error => console.log('Error en el servidor ' + error))