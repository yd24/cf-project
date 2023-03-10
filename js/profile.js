'use-strict'

import Headphone, { loadHeadphones, createHPListItem } from './headphone.js';
import User, { checkAnyUsers, getUser } from './user.js';
import Review from './review.js';
import { openModal, closeModal, checkValid } from './login.js';

document.addEventListener('DOMContentLoaded', function () {

    //======== Global Variables ========
    const params = (new URL(document.location)).searchParams;
    const profile = getUser(params.get('viewingProfile'))[0];
    const headphones = [];
    const hpbrands = [];
    const userHP = [];
    let hp_can_review = [];
    let user = '';
    let user_rights = false;

    if (profile === undefined) {
        document.querySelector('main').classList.add('full-hidden');
        document.getElementById('hp-error').classList.remove('full-hidden');
        document.querySelector('.hp-heading').classList.add('full-hidden');
    } else {
        if (!checkAnyUsers()) {
            //check if user is logged in
            if (localStorage.getItem('currentuser') !== null) {
                user = getUser(localStorage.getItem('currentuser'))[0];
                user_rights = profile.username === user.username;
            } else {
                //workaround when user is not logged in
                user = new User(undefined, undefined);
            }

            document.querySelector('#profile-heading h1').textContent = profile.username;
            document.querySelector('#profile-heading img').src = profile.img;
            document.querySelector('title').textContent = profile.username + '\'s Profile - MyHeadphones';

            //======== Event Listeners ========
            if (user_rights) {
                document.getElementById('add-hp').addEventListener('click', openAddHPModal, false);
                document.getElementById('add-hp-close').addEventListener('click', closeAddHPModal, false);
                document.getElementById('add-review').addEventListener('click', openReviewModal, false);
                document.getElementById('add-review-close').addEventListener('click', closeReviewModal, false);
                document.getElementById('save-review').addEventListener('click', saveReview, false);
                document.getElementById('del-review').addEventListener('click', deleteReview, false);
                document.getElementById('rm-hp').addEventListener('click', toggleRemove, false);
                document.querySelector('#headphones-list .hp-btn-container').classList.remove('full-hidden');
                document.querySelector('#reviews-container .hp-btn-container').classList.remove('full-hidden');
            }

            document.getElementById('owned-tab').addEventListener('click', function () {
                if (!this.classList.contains('tab-selected')) {
                    document.getElementById('headphones-list').classList.remove('full-hidden');
                    document.getElementById('reviews-tab').classList.remove('tab-selected');
                    document.getElementById('reviews-container').classList.add('full-hidden');
                    this.classList.add('tab-selected');
                }
            });

            document.getElementById('reviews-tab').addEventListener('click', function () {
                if (!this.classList.contains('tab-selected')) {
                    document.getElementById('reviews-container').classList.remove('full-hidden');
                    document.getElementById('owned-tab').classList.remove('tab-selected');
                    document.getElementById('headphones-list').classList.add('full-hidden');
                    this.classList.add('tab-selected');
                    populateReviews(user_rights);
                }
            });

            initHeadphones();
        } else {
            document.querySelector('main').classList.add('full-hidden');
            document.getElementById('hp-error').classList.remove('full-hidden');
            document.querySelector('.hp-heading').classList.add('full-hidden');
        }
    }

    //load headphone data
    function initHeadphones() {
        const hpResponse = loadHeadphones().then(hp => {
            for (const prop of hp) {
                const thisHp = new Headphone({
                    'id': prop['id'],
                    'brand': prop['brand'],
                    'modelname': prop['modelname'],
                    'type': prop['type'],
                    'impedance': prop['impedance'],
                    'sensitivity': prop['sensitivity'],
                    'weight': prop['weight'],
                    'driver': prop['driver-type'],
                    'price': prop['price'],
                    'wireless': prop['wireless'],
                    'img': prop['img']
                });
                headphones.push(thisHp);
            }

            //sort headphone data alphabetically by default
            headphones.sort((a, b) => {
                const a_name = a.brand + " " + a.modelname;
                const b_name = b.brand + " " + b.modelname;
                return a_name == b_name ? 0 : (a_name > b_name ? 1 : -1);
            });

            //
            insertBrandNames();

            //======== Load User's Headphone Collection ========
            const profile_collection = profile.headphones;

            for (const user_hp of profile_collection) {
                const tempHP = headphones.find(element => element.id === user_hp);
                userHP.push(tempHP.id);
            }

            const hp_list = document.getElementById('headphones');
            const no_hp = document.getElementById('profile-no-hp');

            if (userHP.length > 0) {
                no_hp.classList.add('full-hidden');
                const hp_ul = document.createElement('ul');

                for (const hpID of userHP) {
                    const hp = headphones.find(element => element.id === hpID);
                    const hp_a = createProfileHPItem(hp);
                    hp_ul.appendChild(hp_a);
                }

                hp_ul.classList.add('width');
                hp_ul.id = 'profile-list';
                hp_list.appendChild(hp_ul);
            } else {
                no_hp.classList.remove('full-hidden');
            }

            //gets headphones that user has already reviewed
            if (localStorage.getItem('reviews') !== null) {
                const reviews = JSON.parse(localStorage.getItem('reviews'));
                const user_has_reviews = reviews.find(element => element.username === user.username);
                if (user_has_reviews === undefined) {
                    document.getElementById('profile-no-reviews').classList.remove('full-hidden');
                    hp_can_review = userHP;
                } else {
                    for (let i = 0; i < userHP.length; i++) {
                        const hp_isReviewed = reviews.find(element => element.review_id === user.username + "_" + userHP[i]);
                        if (hp_isReviewed === undefined) {
                            hp_can_review.push(userHP[i]);
                        }
                    }
                }
            } else {
                document.getElementById('profile-no-reviews').classList.remove('full-hidden');
            }
        });
    }

    function createProfileHPItem(hp) {
        const hp_a = createHPListItem(hp);
        const hp_div = document.createElement('div');
        const i_ele = document.createElement('i');
        i_ele.classList.add('fa-regular');
        i_ele.classList.add('fa-circle-xmark');
        i_ele.classList.add('fa-lg');
        i_ele.classList.add('full-hidden');
        i_ele.addEventListener('click', removeHeadphone, false);
        hp_div.appendChild(hp_a)
        hp_div.appendChild(i_ele);
        return hp_div;
    }

    //======== Headphone Collection Functions ========
    function closeAddHPModal() {
        const addHPModal = document.getElementById('add-hp-modal');
        const overlay = document.querySelector('.overlay');
        closeModal(addHPModal, overlay);
    }

    function openAddHPModal() {
        const addHPModal = document.getElementById('add-hp-modal');
        const overlay = document.querySelector('.overlay');
        openModal(addHPModal, overlay);
    }

    function closeReviewModal() {
        const addReviewModal = document.getElementById('add-review-modal');
        const overlay = document.querySelector('.overlay');
        closeModal(addReviewModal, overlay);
        if (!document.getElementById('del-review').classList.contains('full-hidden')) {
            document.getElementById('del-review').classList.add('full-hidden');
        }
    }

    //loads headphone brands to add headphone modal
    function insertBrandNames() {
        const brand_section = document.getElementById('modal-brand-section');
        brand_section.innerHTML = '<li><h2>Brand Name</h2></li>';

        if (hpbrands.length === 0) {
            for (const hpdata of headphones) {
                if (hpbrands.indexOf(hpdata.brand) === - 1) {
                    hpbrands.push(hpdata.brand);
                }
            }
        }

        for (const brand of hpbrands) {
            const list_ele = document.createElement('li');
            list_ele.textContent = brand;
            list_ele.addEventListener('click', function () {
                const selectedEle = document.querySelector('#modal-brand-section .selected');
                if (selectedEle !== null) {
                    selectedEle.classList.remove('selected');
                }
                this.classList.add('selected');
                insertModelNames(brand);
            });
            brand_section.appendChild(list_ele);
        }
    }

    //loads individual headphone models to add headphone modal
    function insertModelNames(brand) {
        const brandHP = headphones.filter(element => element.brand === brand);
        const modelname_section = document.getElementById('modal-modelname-section');
        modelname_section.innerHTML = '<li><h2>Model Name</h2></li>';

        for (const hp of brandHP) {
            const list_ele = document.createElement('li');

            const p_ele = document.createElement('p');
            p_ele.textContent = hp.brand + " " + hp.modelname;

            const i_ele = document.createElement('i');
            i_ele.classList.add('fa-solid');
            i_ele.classList.add('fa-circle-plus');

            list_ele.appendChild(p_ele);
            list_ele.appendChild(i_ele);
            list_ele.setAttribute('data-hp-id', hp.id);
            list_ele.addEventListener('click', addHeadphone, false);

            modelname_section.appendChild(list_ele);
        }
    }

    function addHeadphone() {
        const hpID = Number(this.getAttribute('data-hp-id'));
        const hp = headphones.find(element => element.id === hpID);
        const allUsers = JSON.parse(localStorage.getItem('users'));

        const hp_exists = userHP.find(element => element === hpID);

        if (!hp_exists) {
            userHP.push(hpID);
        }
        user.headphones = userHP;

        const userIndex = allUsers.findIndex(element => element.username === user.username);

        allUsers[userIndex] = user;
        localStorage.setItem('users', JSON.stringify(allUsers));
        location.reload();
    }

    function removeHeadphone() {
        const parent = this.parentNode;
        const sibling = this.previousSibling;
        const hpID = Number(sibling.getAttribute('data-hp-id'));
        console.log(hpID);
        const hpIndex = userHP.findIndex(element => element === hpID);
        const allUsers = JSON.parse(localStorage.getItem('users'));

        userHP.splice(hpIndex, 1);
        user.headphones = userHP;

        const userIndex = allUsers.findIndex(element => element.username === user.username);
        allUsers[userIndex] = user;
        localStorage.setItem('users', JSON.stringify(allUsers));

        parent.classList.add('full-hidden');
    }

    //toggles remove buttons for headphones
    function toggleRemove() {
        let icons = [];
        if (this.classList.contains('rm-on')) {
            location.reload();
        } else {
            this.classList.add('rm-on');
            this.textContent = 'Save';
            icons = document.querySelectorAll('#profile-list i');
            icons.forEach(element => element.classList.remove('full-hidden'));
        }
    }

    //======== Reviews Functions ========
    function openReviewModal() {
        if (hp_can_review.length > 0) {
            initReviewModal();

            const addReviewModal = document.getElementById('add-review-modal');
            const overlay = document.querySelector('.overlay');
            openModal(addReviewModal, overlay);
        } else {
            alert('Add more headphones to your collection to review them!');
        }
    }

    function openEditReviewModal(review_id) {
        const reviews = JSON.parse(localStorage.getItem('reviews'));
        const editing_review = reviews.find(element => element.review_id === review_id);
        initReviewModal(editing_review);

        const addReviewModal = document.getElementById('add-review-modal');
        const overlay = document.querySelector('.overlay');
        openModal(addReviewModal, overlay);
    }

    function initReviewModal(editing_review = null) {
        const review_list = document.getElementById('hp-review-list');
        const default_opt = document.createElement('option');

        review_list.innerHTML = '';
        if (editing_review !== null) {
            const review_hp = headphones.find(element => element.id === Number.parseInt(editing_review.headphone_id));

            default_opt.textContent = review_hp.brand + " " + review_hp.modelname;
            default_opt.value = review_hp.id;
            review_list.appendChild(default_opt);

            const rating_id = "star-" + Number.parseInt(editing_review.rating);
            const title = document.getElementById('review-title');
            const content = document.getElementById('review-content');
            title.value = editing_review.title;
            content.value = editing_review.content;
            document.getElementById(rating_id).checked = true;
            review_list.disabled = true;
        } else {
            const review_form = document.getElementById('add-review-modal');
            review_form.reset();
            default_opt.textContent = '-- Select a headphone to review -- ';
            default_opt.value = '';
            review_list.appendChild(default_opt);
            for (const hpID of hp_can_review) {
                const selected_hp = headphones.find(element => element.id === hpID);
                const hp_name = selected_hp.brand + " " + selected_hp.modelname;
                const option = document.createElement('option');
                option.textContent = hp_name;
                option.setAttribute('value', hpID);
                review_list.appendChild(option);
            }
            review_list.disabled = false;
        }
    }

    function populateReviews(user_rights) {
        const reviews_container = document.getElementById('reviews');
        const no_reviews = document.getElementById('profile-no-reviews');

        //resets reviews container
        while (reviews_container.firstChild) {
            reviews_container.removeChild(reviews_container.firstChild);
        }
        let reviews = localStorage.getItem('reviews');
        if (reviews === null) {
            no_reviews.classList.remove('full-hidden');
        } else {
            //get reviews
            reviews = JSON.parse(reviews);
            reviews = reviews.filter(element => element.username === profile.username);
            if (reviews.length > 0) {
                no_reviews.classList.add('full-hidden');

                //sort reviews by most recent
                reviews = reviews.sort((a, b) => {
                    const date1 = Date.parse(a.date);
                    const date2 = Date.parse(b.date);
                    return date1 == date2 ? 0 : (date1 < date2 ? 1 : -1);
                });
                const ul = document.createElement('ul');
                for (const review of reviews) {
                    const li = document.createElement('li');
                    li.setAttribute('data-review-id', review.review_id);

                    //add review title
                    const h3 = document.createElement('h3');
                    h3.textContent = review.title;

                    //add link to reviewed headphone
                    const hp = headphones.find(element => element.id === Number.parseInt(review.headphone_id));
                    const review_info_p = document.createElement('p');
                    const review_info = '<span>review for <a href="./headphone.html?hpID=' + review.headphone_id + '"><strong>'
                        + hp.brand + " " + hp.modelname + '</strong></a></span><span>' + review.date + '</span>';
                    review_info_p.innerHTML = review_info;
                    review_info_p.classList.add('review-info');

                    //add content
                    const review_content_p = document.createElement('p');
                    review_content_p.classList.add('review-content');
                    review_content_p.textContent = review.content;

                    //add star rating
                    const div = document.createElement('div');
                    for (let i = 1; i < 6; i++) {
                        const star_ele = document.createElement('i');
                        star_ele.classList.add('fa-solid');
                        star_ele.classList.add('fa-star');
                        if (i <= review.rating) {
                            star_ele.classList.add('star-point');
                        } else {
                            star_ele.classList.add('star');
                        }
                        div.appendChild(star_ele);
                    }

                    li.appendChild(h3);
                    li.appendChild(review_info_p);
                    li.appendChild(div);
                    li.appendChild(review_content_p);

                    //if logged-in, add edit button for review
                    if (user_rights) {
                        const i_ele = document.createElement('i');
                        i_ele.classList.add('edit-mark');
                        i_ele.classList.add('fa-solid');
                        i_ele.classList.add('fa-pen-to-square');
                        i_ele.classList.add('fa-lg');
                        i_ele.addEventListener('click', editReview, false);
                        li.appendChild(i_ele);
                    }

                    ul.appendChild(li);
                    reviews_container.appendChild(ul);
                }
            }

        }
    }

    function editReview() {
        const review_id = this.parentNode.getAttribute('data-review-id');
        document.getElementById('del-review').classList.remove('full-hidden');
        openEditReviewModal(review_id);
    }

    function saveReview() {
        const username = user.username;
        const hpID = document.getElementById('hp-review-list');
        const title = document.getElementById('review-title');
        const rating = document.querySelector('.star-rating:checked');
        const content = document.getElementById('review-content');

        const hp_err = document.getElementById('hp-err');
        const title_err = document.getElementById('title-err');
        const rating_err = document.getElementById('rating-err');
        const content_err = document.getElementById('content-err');

        //Check that user input is valid
        const valid1 = checkValid(hpID, hp_err, 'Please select a headphone.');
        const valid2 = checkValid(title, title_err, 'Please enter a title.');
        const valid3 = (() => {
            if (rating === null) {
                rating_err.textContent = 'Please select a rating.';
            } else {
                rating_err.textContent = '';
            }
            return rating !== null;
        })();
        const valid4 = checkValid(content, content_err, 'Please enter your review.');

        if (valid1 && valid2 && valid3 && valid4) {
            const review_date = new Date().toLocaleDateString('en-US');
            let reviews = [];
            const review = new Review({
                "username": username,
                'headphone_id': hpID.value,
                "title": title.value,
                "rating": rating.value,
                "content": content.value,
                "date": review_date
            });

            if (localStorage.getItem('reviews') !== null) {
                reviews = JSON.parse(localStorage.getItem('reviews'));
            }

            const og_review = reviews.find(element => element.review_id === review.review_id);
            if (og_review === undefined) {
                reviews.push(review);
            } else {
                const review_index = reviews.indexOf(og_review);
                reviews.splice(review_index, 1);
                reviews.push(review);
            }
            localStorage.setItem('reviews', JSON.stringify(reviews));
            location.reload();
        }
    }

    function deleteReview() {
        const review_id = user.username + "_" + document.getElementById('hp-review-list').value;
        let reviews = JSON.parse(localStorage.getItem('reviews'));
        reviews = reviews.filter(element => element.review_id !== review_id);
        localStorage.setItem('reviews', JSON.stringify(reviews));
        location.reload();
    }
});