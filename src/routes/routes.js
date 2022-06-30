// DAOS
const { ProductoDaoArchivo } = require('../daos/productos/ProductosDaoArchivo');
let product = new ProductoDaoArchivo();

const { ChatDaoArchivo } = require('../daos/chat/ChatDaoArchivo');
let chat = new ChatDaoArchivo();


//ROUTES
function getRoot(req, res) {
        res.render('pages/log', {main: true, login: false, signup : false, loginError: false, signupLogout: false , logout : false , error : false});
        //res.render('pages/log', {main: true});
}

function getLogin(req, res) {
    if (req.isAuthenticated()) {
        res.redirect('products')
    } else {
        //res.render('pages/log', {login : true});
        res.render('pages/log', {main: false, login: true, signup : false, loginError: false, signupLogout: false, logout : false , error : false});
    }
}

function getSignup(req, res) {
    // res.render('pages/log', {signup : true});
    res.render('pages/log', {main: false, login: false, signup : true, loginError: false, signupLogout: false, logout : false , error : false});

}

function postLogin (req, res) {
    if (req.isAuthenticated()) {
        res.redirect('products')
    } else {
        res.redirect('login')
    }
}

function postSignup (req, res) {
    if (req.isAuthenticated()) {
        res.redirect('products')
    } else {
        res.redirect('login')
    }
}

async function getProducts (req, res){
    if (req.isAuthenticated()) {
        let user = req.user;
        const prod = await product.getAll().then( (obj) =>{
            obj.length > 0 ? res.render( 'pages/index', {listExists: true, listNotExists: false, user: user, isUser:true}) : res.render('pages/index', {listNotExists: true, listExists: false, user: user, isUser:true})
        }) 
    } else {
        res.redirect('login')
    }
}

function getFaillogin (req, res) {
    console.log('error en login');
    //res.render('pages/log', {error: true});
    res.render('pages/log', {main: false, login: false, signup : false, loginError: true, signupLogout: false, logout : false , error : false});
}

function getFailsignup (req, res) {
    console.log('error en signup');
    //res.render('signup-error', {error: true});
     res.render('pages/log', {main: false, login: false, signup : false, loginError: false, signupLogout: true, logout : false , error : false});
}

function getLogout (req, res) {
    req.logout( (err) => {
        if (!err) {
            let user = req.body.name;
            //res.render('pages/log', { logout : false})
            res.render('pages/log', {main: false, login: false, signup : false, loginError: false, signupLogout: false, logout : true, name: user , error : false});
        } 
    });
}

function failRoute(req, res){
    res.status(404).render('pages/log', {main: false, login: false, signup : false, loginError: false, signupLogout: false, logout : false , error : true});
}


module.exports = {
    getRoot,
    getLogin,
    postLogin,
    getFaillogin,
    getLogout,
    failRoute,
    getSignup,
    postSignup,
    getFailsignup,
    getProducts
}