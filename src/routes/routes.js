// DAOS
const { ProductoDaoArchivo } = require('../daos/productos/ProductosDaoArchivo');
let product = new ProductoDaoArchivo();

const { ChatDaoArchivo } = require('../daos/chat/ChatDaoArchivo');
let chat = new ChatDaoArchivo();


//ROUTES
function getRoot(req, res) {
    res.render('pages/log', {main: true});
}

function getLogin(req, res) {
    if (req.isAuthenticated()) {
        res.redirect('profile')
    } else {
        res.render('pages/log', {login : true});
    }
}

function getSignup(req, res) {
    res.render('pages/log', {signup : true});
}

function postLogin (req, res) {
    if (req.isAuthenticated()) {
        res.redirect('profile')
    } else {
        res.redirect('login')
    }
}

function postSignup (req, res) {
    if (req.isAuthenticated()) {
        res.redirect('profile')
    } else {
        res.redirect('login')
    }
}

// function getProfile (req, res) {
//     if (req.isAuthenticated()) {
//         let user = req.user;
//         res.render('profileUser', { user: user, isUser:true })
//     } else {
//         res.redirect('login')
//     }
// }

 function getProducts (req, res){
    if (req.isAuthenticated()) {
        let user = req.user;

        const prod = product.getAll();
        prod.length > 0 ? res.render( 'pages/index', {listExists: true, listNotExists: false, user: user, isUser:true}) : res.render('pages/index', {listNotExists: true, listExists: false, user: user, isUser:true})
    } else {
        res.redirect('login')
    }
}

// function getProducts async(req, res) =>{
//     const prod = await product.getAll().then( (obj) =>{
//         obj.length  > 0 ?  res.render('pages/index', {listExists: true, listNotExists: false,  name : req.session.user }) : res.render('pages/index', {listNotExists: true, listExists: false,  name : req.session.user}) ;
//     })  
// })

function getFaillogin (req, res) {
    console.log('error en login');
    res.render('login-error', {});
}

function getFailsignup (req, res) {
    console.log('error en signup');
    res.render('signup-error', {});
}

function getLogout (req, res) {
    req.logout( (err) => {
        if (!err) {
            res.render('main');
        } 
    });
}

function failRoute(req, res){
    res.status(404).render('routing-error', {});
}

function checkAuthentication(req, res, next) {
    if (req.isAuthenticated()) {
        //req.isAuthenticated() will return true if user is logged in
        next();
    } else {
        res.redirect("/login");
    }
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
    checkAuthentication,
    getProducts
}