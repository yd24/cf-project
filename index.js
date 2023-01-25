'use strict';

document.addEventListener('DOMContentLoaded', function() {
    const loggedin = JSON.parse(localStorage.getItem('loggedin'));

    /* login modal */
    const signupBtn = document.getElementById('signup');
    signupBtn.addEventListener('click', openLoginModal, false);

    let heroBtn = null;
    if (document.getElementById('hero-signup') !== null) {
        heroBtn = document.getElementById('hero-signup');
        heroBtn.addEventListener('click', openLoginModal, false);
    }

    const closeBtn = document.querySelectorAll('.close-modal');
    closeBtn.forEach(function(ele) {
        ele.addEventListener('click', closeLoginModal, false);
    });

    const createBtn = document.getElementById('create-btn');
    createBtn.addEventListener('click', setupUser, false);

    const loginBtn = document.getElementById('login-btn');
    loginBtn.addEventListener('click', logUserIn, false);

    const userBtn = document.getElementById('user');
    userBtn.addEventListener('click', toggleSubMenu, false);

    const createUser = document.querySelector('.create-user');

    /* modal functions */
    function openLoginModal() {
        const modal = document.getElementById('login-modal');
        const overlay = document.querySelector('.overlay');
        if (modal.classList.contains('hidden')) {
            modal.classList.remove('hidden');
            overlay.classList.remove('full-hidden');
        }

        if (modal.ariaHidden) {
            modal.ariaHidden = 'false';
        }
    }

    function closeLoginModal() {
        const modal = document.getElementById('login-modal');
        const overlay = document.querySelector('.overlay');
        modal.classList.add('hidden');
        modal.ariaHidden = true;
        overlay.classList.add('full-hidden');
        createUser.classList.add('hidden');
        createBtn.textContent = 'Sign Up';
    }

    /* grab input for user functions */
    function setupUser() {
        if (createUser.classList.contains('hidden')) {
            createUser.classList.remove('hidden');
            createBtn.textContent = 'Create New Account';
            createBtn.classList.add('set')
        } else if (createBtn.classList.contains('set')) {
            const usr = document.getElementById('login-modal').elements['create-username'].value;
            const pw = document.getElementById('login-modal').elements['create-password'].value;
            handleCreate(usr, pw);
        }
    }

    function logUserIn() {
        const usr = document.getElementById('login-modal').elements['username'].value;
        const pw = document.getElementById('login-modal').elements['password'].value;
        handleLogin(usr, pw);
    }

    /* user functions */
    function handleCreate(username, password) {
        const user = new User(username, password);
        console.log(typeof user);
        if (checkAnyUsers()) {
            const users = [];
            users.push(user);
            localStorage.setItem('users', JSON.stringify(users));
            console.log('First user created!');
            handleLogin(username, password);
            location.reload();
        } else {
            const tempUsers = getUser(username);
            if (tempUsers.length === 0) {
                const tempList = JSON.parse(localStorage.getItem('users'));
                tempList.push(user);
                localStorage.setItem('users', JSON.stringify(tempList));
                console.log('User created!');
                handleLogin(username, password);
                location.reload();
            } else {
                console.log('User already exists');
            }
        }
    }

    function handleLogin(username, password) {
        if (!loggedin) {
            const user = getUser(username);
            if(user === null) {
                console.log('There are no registered users yet.');
            } else {
                if (user.length > 0) {
                    const currentUser = user[0];
                    if (currentUser.password === password) {
                        console.log('Login success!');
                        localStorage.setItem('currentuser', username);
                        localStorage.setItem('loggedin', JSON.stringify(true));
                        location.reload();
                    } else {
                        console.log('Wrong password, try again!')
                    }
                } else {
                    console.log('User doesn\'t exist.')
                }
            }
        }
    }

    function initLogin() {
        const currentUser = localStorage.getItem('currentuser');
        const userProfile = getUser(currentUser)[0];
        signupBtn.parentNode.classList.add('full-hidden');
        userBtn.classList.remove('full-hidden');
        document.querySelector('#user button p').textContent = "Welcome, " + userProfile.username;

        const signout = document.getElementById('sign-out');
        signout.addEventListener('click', logOut, false);
    
        const goProfile = document.querySelector('#sub-menu button');
        goProfile.addEventListener('click', function() {
            goToProfile(userProfile.username);
        }, false);

        if (heroBtn !== null) {
            heroBtn.removeEventListener('click', openLoginModal, false);
            heroBtn.textContent = 'Go to your Profile'
            heroBtn.addEventListener('click', function() {
                goToProfile(userProfile.username);
            }, false);
            console.log('Welcome, ' + userProfile.username + '!');
        }
    }

    function toggleSubMenu() {
        const submenu = document.getElementById('sub-menu');
        if (submenu.classList.contains('hidden')) {
            submenu.classList.remove('hidden');
        } else {
            submenu.classList.add('hidden');
        }
    }

    function goToProfile(username) {
        localStorage.setItem('viewingProfile', username); 
        location.href = './profile.html';
    }

    function logOut() {
        localStorage.removeItem('currentuser');
        localStorage.removeItem('loggedin');
        location.reload();
    }

    /* user helper functions */
    function getUser(username) {
        if (!checkAnyUsers()) {
            const tempUsers = JSON.parse(localStorage.getItem('users'));
            const userExists = tempUsers.filter( element => element.username === username );
            return userExists;
        } else {
            return null;
        }
    }

    function checkAnyUsers() {
        return localStorage.getItem('users') === null;
    }

    class User {
        username;
        password;
        headphones;

        constructor(username, password) {
            this.username = username;
            this.password = password;
            this.headphones = [];
        }

        get username() {
            return this.username;
        }

        get password() {
            return this.password;
        }
    }

    if (loggedin) {
        initLogin();
    }
});