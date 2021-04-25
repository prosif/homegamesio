const clearChildren = (el) => {
    while (el.firstChild) {
        el.removeChild(el.firstChild);
    }
};

const makeGet = (endpoint, headers) => new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', endpoint, true);

    for (const key in headers) {
        xhr.setRequestHeader(key, headers[key]);
    }

    xhr.onreadystatechange = () => {
        if (xhr.readyState === XMLHttpRequest.DONE) {
            if (xhr.status === 200) {
                resolve(xhr.response);
            } else {
                console.log("uh oh");
                console.log(xhr);
                reject(xhr.response)
            }
        }
    }


    xhr.send();
});

const makePost = (endpoint, payload, notJson)  => new Promise((resolve, reject) => {
    var xhr = new XMLHttpRequest();
    xhr.open("POST", endpoint, true);

    xhr.setRequestHeader("Content-Type", "application/json");

    xhr.onreadystatechange = () => {
        if (xhr.readyState === XMLHttpRequest.DONE) {
            if (xhr.status === 200) {
                if (notJson) {
                    resolve(xhr.response);
                } else {
                    resolve(JSON.parse(xhr.response));
                }
            } else {
                console.log("uh oh");
                console.log(xhr);
                reject(xhr.response)
            }
        }
    }

    xhr.send(JSON.stringify(payload));
});

const createGame = (gameName) => new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("POST", "https://landlord.homegames.io/games");

    request.setRequestHeader('hg-username', window.hgUserInfo.username);
    request.setRequestHeader('hg-token', window.hgUserInfo.tokens.accessToken);
    request.setRequestHeader("Content-Type", "application/json");

    request.onreadystatechange = (e) => {
        if (request.readyState === XMLHttpRequest.DONE) {
            if (request.status === 200) {
                console.log(request.response);
                resolve(JSON.parse(request.response));
            } else {
                reject();
            }
        }
    };

    const payload = {
        game_name: gameName
    };

    request.send(JSON.stringify(payload));
});

const uploadAsset = (asset, cb) => new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', asset);

    const request = new XMLHttpRequest();

    request.open("POST", "https://landlord.homegames.io/asset"); 

    request.setRequestHeader('hg-username', window.hgUserInfo.username);
    request.setRequestHeader('hg-token', window.hgUserInfo.tokens.accessToken);

    request.onreadystatechange = (e) => {
        if (request.readyState === XMLHttpRequest.DONE) {
            if (request.status === 200) {
                resolve();
            } else {
                reject();
            }
        }
    };

    request.onloadstart = () => {
        cb && cb('loadstart', {});
    };

    request.onload = () => {
        cb && cb('load', {});
    };

    request.onloadend = () => {
        cb && cb('loadend', {});
    };

    request.onprogress = (e) => {
        cb && cb('progress', {});
    };

    request.onerror = (error) => {
        cb && cb('error', {error});
    };

    request.onabort = () => {
        cb && cb('abort', {});
    };

    request.send(formData);
});

const login = (username, password) => new Promise((resolve, reject) => {
    makePost('https://auth.homegames.io', {
        username,
        password,
        type: 'login'
    }).then(tokens => {
        resolve({
            username,
            tokens
        });
    });
});

const signup = (email, username, password) => new Promise((resolve, reject) => {
    makePost('https://auth.homegames.io', {
        email,
        username,
        password,
        type: 'signUp'
    }).then(tokens => {
        resolve({
            username,
            tokens
        });
    });
});

const simpleDiv = (text) => {
    const div = document.createElement('div');

    if (text) {
        div.innerHTML = text;
    }

    return div;
};

const handleLogin = (userInfo) => {
    const settingsButton = document.getElementById('settings');

    clearChildren(settingsButton);

    settingsButton.onclick = () => {
        showContent('dashboard');
    };

    const gearSpan = document.createElement('span');
    gearSpan.innerHTML = '&#9881';
    gearSpan.style = 'float: right; font-size: 10vh; width: 30%;';

    const usernameDiv = document.createElement('span');
    usernameDiv.innerHTML = userInfo.username;

    settingsButton.appendChild(gearSpan);
    settingsButton.appendChild(usernameDiv);
//    settingsButton.innerHTML = `&#9881;${userInfo.username}`;

    window.hgUserInfo = userInfo;
    hideModal();
    showContent('dashboard');
};
                

const loader = () => {
    const el = document.createElement('div');
    el.className = 'loading';
    return el;
};

const loaderBlack = () => {
    const el = document.createElement('div');
    el.className = 'loading-black';
    return el;
};

const modals = {
    'download': {
        render: () => {
            return simpleDiv('want to download some shit'); 
        }
    },
    'game-detail': {
        render: (game) => {
            const container = document.createElement('div');

            let editingDescription = false;

            const gameHeader = document.createElement('h2');
            gameHeader.innerHTML = game.name;

            container.appendChild(gameHeader);

            const getDescription = () => {
                const descriptionSection = document.createElement('div');
                
                if (!editingDescription) {
                    const descriptionText = simpleDiv(game.description || 'No description available');
                    const editButton = simpleDiv('Edit');
    
                    editButton.onclick = () => {
                        editingDescription = true;
                        clearChildren(descriptionSection);
                        const newDescription = getDescription();
                        descriptionSection.appendChild(newDescription);
                    };

                    descriptionSection.appendChild(descriptionText);
                    descriptionSection.appendChild(editButton);
                } else {
                    const descriptionTextBox = document.createElement('textarea');
                    if (game.description) {
                        descriptionTextBox.value = game.description;
                    } else {
                        descriptionTextBox.setAttribute('placeholder', 'Enter a description here');
                    }
                    descriptionSection.appendChild(descriptionTextBox);

                    const doneButton = simpleDiv('Done');
                    doneButton.onclick = () => {
                        const newDescription = descriptionTextBox.value;

                        const _loader = loader();
                        clearChildren(descriptionSection);
                        descriptionSection.appendChild(_loader);
                        const request = new XMLHttpRequest();
                        request.open("POST", "https://landlord.homegames.io/games/" + game.id + "/update");

                        request.setRequestHeader('hg-username', window.hgUserInfo.username);
                        request.setRequestHeader('hg-token', window.hgUserInfo.tokens.accessToken);
                        request.setRequestHeader("Content-Type", "application/json");

                        request.onreadystatechange = (e) => {
                            if (request.readyState === XMLHttpRequest.DONE) {
                                if (request.status === 200) {
                                    clearChildren(container);
                                    const newRender = modals['game-detail'].render(game);
                                    container.appendChild(newRender);
                                } 
                            }
                        };

                        request.send(JSON.stringify({description: newDescription}));

                        //editingDescription = false;
                        //clearChildren(descriptionSection);
                        //const newDescription = getDescription();
                        //descriptionSection.appendChild(newDescription);
                    };

                    descriptionSection.appendChild(doneButton);
                }

                return descriptionSection;
            };

            const getVersions = () => {
                const versionContainer = document.createElement('div');

                const versionHeader = document.createElement('h3');
                versionHeader.innerHTML = 'Versions';

                const _loader = loaderBlack();

                versionContainer.appendChild(versionHeader);

                const publishSection = document.createElement('div');

                const publishButton = simpleDiv('Publish');

                const repoOwnerForm = document.createElement('input');
                repoOwnerForm.type = 'text';
                repoOwnerForm.setAttribute('placeholder', 'Github repo owner (eg. prosif)');

                const repoNameForm = document.createElement('input');
                repoNameForm.type = 'text';
                repoNameForm.setAttribute('placeholder', 'Github repo name (eg. do-dad)');

                const commitForm = document.createElement('input');
                commitForm.type = 'text';
                commitForm.setAttribute('placeholder', 'GitHub repo commit (eg. 265ce105af20a721e62dbf93646197f2c2d33ac1)');

                publishButton.onclick = () => {
                    console.log('you want to publish a new version of thing');
                    const request = new XMLHttpRequest();
                    request.open("POST", "https://landlord.homegames.io/games/" + game.id + "/publish");
                
                    request.setRequestHeader('hg-username', window.hgUserInfo.username);
                    request.setRequestHeader('hg-token', window.hgUserInfo.tokens.accessToken);
                    request.setRequestHeader("Content-Type", "application/json");
                
                    request.onreadystatechange = (e) => {
                        if (request.readyState === XMLHttpRequest.DONE) {
                            if (request.status === 200) {
                                console.log('published!');
                                console.log(request.response);
                            } else {
                                console.log('error');
                            }
                        }
                    };
                
                    const payload = {
                        owner: repoOwnerForm.value, 
                        repo: repoNameForm.value,
                        commit: commitForm.value
                    };
                
                    request.send(JSON.stringify(payload));
                };

                publishSection.appendChild(repoOwnerForm);
                publishSection.appendChild(repoNameForm);
                publishSection.appendChild(commitForm);
                publishSection.appendChild(publishButton);

                versionContainer.appendChild(publishSection);
                versionContainer.appendChild(_loader);

                makeGet('https://landlord.homegames.io/games/' + game.id, {
                    'hg-username': window.hgUserInfo.username,
                    'hg-token': window.hgUserInfo.tokens.accessToken
                }).then((_versions) => {
                    console.log('versions');
                    console.log(_versions);
                    versionContainer.removeChild(_loader);

                    const versions = JSON.parse(_versions).versions;

                    if (versions.length == 0) {
                        const noVersions = simpleDiv('No published versions');
                        versionContainer.appendChild(noVersions);
                    } else {
                        const versionTable = sortableTable(versions);
                        versionContainer.appendChild(versionTable);
                    }
                });

                return versionContainer;
 
            };

            const descriptionSection = getDescription();
            const versionSection = getVersions();
            
            container.appendChild(descriptionSection);
            container.appendChild(versionSection);

            return container;
        }
    },
    'support': {
        render: () => {
            const container = document.createElement('div');
            container.style = 'height: 100%';

            const emailText = simpleDiv('Send us questions, feedback, or pretty much whatever');
            emailText.style = 'font-size: 1.4em';

            const emailForm = document.createElement('input');
            emailForm.type = 'text';
            emailForm.setAttribute('placeHolder', 'If you want a response, enter your email address here');
            emailForm.style = 'width: 50%; margin-top: 3%; margin-bottom: 3%;';

            const messageForm = document.createElement('textarea');
            messageForm.style = 'width: 100%; height: 60%; margin-bottom: 3%;';

            messageForm.oninput = () => {
                sendButton.className = messageForm.value.length > 0 ? 'clickable hg-yellow' : 'grayish';
            }

            const sendButton = simpleDiv('Send');
            sendButton.style = 'text-align: center; border-radius: 1vw; width: 50%; height: 2.5em; margin-left: 25%; line-height: 2.5em;';
            sendButton.className = 'grayish';

            sendButton.onclick = () => {
                if (!messageForm.value) {
                    return;
                }

                clearChildren(container);
                
                container.style = 'font-size: 2em; text-align: center';

                container.appendChild(loader());

                makePost('/contact', {
                    email: emailForm.value,
                    message: messageForm.value
                }).then((res) => {
                    console.log(res);
                    if (res.success) { 
                        container.innerHTML = 'Success! Your message has been sent.';
                    } else {
                        container.innerHTML = 'Could not send your message. Please email support@homegames.io';
                    }
                });
            };

            container.appendChild(emailText);
            container.appendChild(emailForm);

            container.appendChild(messageForm);
            container.appendChild(sendButton);

            return container;
        }
    },
    'login': {
        render: () => {
            const container = document.createElement('div');

            const loginHeader = document.createElement('h2');
            loginHeader.innerHTML = 'Log in';

            const signupHeader = document.createElement('h2');
            signupHeader.innerHTML = 'Sign up';

            const usernameForm = document.createElement('input');
            usernameForm.type = 'text';
            usernameForm.setAttribute('placeholder', 'Username');

            const passwordForm = document.createElement('input');
            passwordForm.type = 'password';
            passwordForm.setAttribute('placeholder', 'Password');

            const loginButton = simpleDiv('Log in');
            loginButton.className = 'hg-button';
            loginButton.onclick = () => {
                clearChildren(container);
                const _loader = loader();
                container.style = 'text-align: center';
                container.appendChild(_loader);
                login(usernameForm.value, passwordForm.value).then(handleLogin)
            };

            const loginSection = document.createElement('div');
            loginSection.appendChild(loginHeader);
            loginSection.appendChild(usernameForm);
            loginSection.appendChild(passwordForm);
            loginSection.appendChild(loginButton);

            const signupSection = document.createElement('div');
            signupSection.appendChild(signupHeader);
            
            const signupEmailForm = document.createElement('input');
            signupEmailForm.type = 'text';
            signupEmailForm.setAttribute('placeholder', 'Email');
            
            const signupUsernameForm = document.createElement('input');
            signupUsernameForm.type = 'text';
            signupUsernameForm.setAttribute('placeholder', 'Username');
            
            const signupPasswordForm1 = document.createElement('input');
            signupPasswordForm1.type = 'password';
            signupPasswordForm1.setAttribute('placeholder', 'Password');

            const signupPasswordForm2 = document.createElement('input');
            signupPasswordForm2.type = 'password';
            signupPasswordForm2.setAttribute('placeholder', 'Password (again)');

            const signupButton = simpleDiv('Sign up');
            signupButton.className = 'hg-button';
            signupButton.onclick = () => {
                if (signupPasswordForm1.value === signupPasswordForm2.value) {
                    signup(signupEmailForm.value, signupUsernameForm.value, signupPasswordForm1.value).then(handleSignup); 
                }
            };

            signupSection.appendChild(signupEmailForm);
            signupSection.appendChild(signupUsernameForm);
            signupSection.appendChild(signupPasswordForm1);
            signupSection.appendChild(signupPasswordForm2);
            signupSection.appendChild(signupButton);

            container.appendChild(loginSection);
            container.appendChild(signupSection);

            return container;
        }
    },
    'signup': {
        render: () => {
            const ting = document.createElement('div');
            ting.innerHTML = 'Hello world';

            return ting;
        }
    },
    'child': {
        render: () => {
            const ting = document.createElement('div');
            ting.innerHTML = 'I am a child';

            return ting;
        },
        childOf: 'signup'
    }
};

const showModal = (modalName, args) => {
    const modal = document.getElementById('modal');
    
    const modalContentEl = modal.getElementsByClassName('content')[0];

    clearChildren(modalContentEl);

    const modalData = modals[modalName];

    const modalContent = modalData.render(args);
    
    if (modalData.childOf) {
        const backButton = document.createElement('div');
        backButton.innerHTML = 'back';
        backButton.onclick = () => {
            showModal(modalData.childOf);
        }
        modalContentEl.appendChild(backButton);
    }

    modalContentEl.appendChild(modalContent);

    modal.removeAttribute('hidden');
};

const dashboards = {
    'default': {
        render: () => new Promise((resolve, reject) => {
            const meSection = document.createElement('div');
            const memberSince = simpleDiv('Member since: Coming soon');
            const certStatus = simpleDiv('Cert status: Coming soon');
            const changeEmail = simpleDiv('Change email: Coming soon');
            const changePassword = simpleDiv('Change password: Coming soon');

            meSection.appendChild(memberSince);
            meSection.appendChild(certStatus);
            meSection.appendChild(changeEmail);
            meSection.appendChild(changePassword);

            const gamesButton = simpleDiv('My Games');
            const assetsButton = simpleDiv('My Assets');
    
            gamesButton.onclick = () => updateDashboardContent('games');
    
            assetsButton.onclick = () => updateDashboardContent('assets');
    
            const el = document.createElement('div');
    
            el.appendChild(meSection);
            el.appendChild(gamesButton);
            el.appendChild(assetsButton);
    
            resolve(el);
        })
    },
    'games': {
        render: () => new Promise((resolve, reject) => {
            const container = document.createElement('div');

            if (!window.hgUserInfo) {
                container.innerHTML = 'Log in to manage games';
                resolve(container);
            } else {
                const createSection = document.createElement('div');

                const nameForm = document.createElement('input');
                nameForm.type = 'text';
                nameForm.setAttribute('placeholder', 'Name');

                const createButton = simpleDiv('Create');
                createButton.className = 'hg-button content-button';
                createButton.onclick = () => { 
                    const _loader = loaderBlack();
                    createGame(nameForm.value).then(game => {
                        dashboards['games'].render().then((_container) => {
                            clearChildren(container);
                            container.appendChild(_container);
                        });
                    });
                };

                createSection.appendChild(nameForm);
                createSection.appendChild(createButton);

                container.appendChild(createSection);

                const myGamesHeader = document.createElement('h1');
                myGamesHeader.innerHTML = 'My Games';

                container.appendChild(myGamesHeader);

                const _loader = loaderBlack();
                container.appendChild(_loader);
               
                makeGet('https://landlord.homegames.io/games', {
                    'hg-username': window.hgUserInfo.username,
                    'hg-token': window.hgUserInfo.tokens.accessToken
                }).then((_games) => {
                    container.removeChild(_loader);
                    const games = JSON.parse(_games).games;

                    const onCellClick = (index, field) => {
                        const clickedGame = games[index];
                        console.log('clicked on');
                        console.log(clickedGame[field]);
                        showModal('game-detail', clickedGame);
                    };
 
                    const table = sortableTable(games, {key: 'created', order: 'desc'}, onCellClick);
                    container.appendChild(table);
                });

                resolve(container);
            }
        }),
        childOf: 'default'
    },
    'assets': {
        render: () => new Promise((resolve, reject) => {
            const container = document.createElement('div');

            if (!window.hgUserInfo) {
                container.innerHTML = 'Log in to manage assets';
                resolve(container);
            } else {
                const uploadSection = document.createElement('div');

                const fileForm = document.createElement('input');
                fileForm.type = 'file';

                const uploadButton = simpleDiv('Upload');
                uploadButton.className = 'hg-button content-button';

                uploadSection.appendChild(fileForm);
                uploadSection.appendChild(uploadButton);

                uploadButton.onclick = () => {
                    if (fileForm.files.length == 0) {
                        return;
                    }

                    const eventHandler = (_type, _payload) => {
                        if (_type == 'loadstart') {
                            clearChildren(uploadSection);
                            const _loader = loaderBlack();
                            uploadSection.appendChild(_loader);
                        }
                    };

                    uploadAsset(fileForm.files[0], eventHandler).then(() => {
                        dashboards['assets'].render().then((_container) => {
                            clearChildren(container);
                            container.appendChild(_container);
                        });
                    });
                };

                const assetsHeader = document.createElement('h1');
                assetsHeader.innerHTML = 'My Assets';

                container.appendChild(uploadSection);

                const _loader = loaderBlack();
                container.appendChild(_loader);

                makeGet('https://landlord.homegames.io/assets', {
                    'hg-username': window.hgUserInfo.username,
                    'hg-token': window.hgUserInfo.tokens.accessToken
                }).then((_assets) => {
                    container.removeChild(_loader);
                    const assets = JSON.parse(_assets).assets;
                    const table = sortableTable(assets, {key: 'created', order: 'desc'});
                    container.appendChild(assetsHeader);
                    container.appendChild(table);
                });

                resolve(container);
            }
        }),
        childOf: 'default'
    },
    'me': {
        render: () => {
            return simpleDiv('meeee');
        },
        childOf: 'default'
    }
};

const updateDashboardContent = (state) => {
    getDashboardContent(state).then(dashboardContent => {
        const dashboardContentEl = document.getElementById('dashboard-content');
        clearChildren(dashboardContentEl);
        dashboardContentEl.appendChild(dashboardContent);
    });
};

const getDashboardContent = (state) => new Promise((resolve, reject) => {

    const buildThing = (thing) => new Promise((resolve, reject) => {
        const el = document.createElement('div');

        dashboards[thing].render().then(content => {

            if (dashboards[thing].childOf) {
                const backButton = document.createElement('div');
                backButton.innerHTML = "back";
                backButton.onclick = () => {
                    updateDashboardContent(dashboards[thing].childOf);
                };
                el.appendChild(backButton);
            }

            el.appendChild(content);

            resolve(el);
        });
    });

    if (!state || !dashboards[state]) {
        resolve(buildThing('default'));
    } else {
        resolve(buildThing(state));
    }
});

const showContent = (contentName) => {
    const contentEl = document.getElementById('content');

    const infoContentEl = document.getElementById('info-content');
    const dashboardContentEl = document.getElementById('dashboard-content');

    if (contentName == 'dashboard') {
        clearChildren(dashboardContentEl);
        getDashboardContent().then(dashboardContent => {
            infoContentEl.setAttribute('hidden', '');
            dashboardContentEl.appendChild(dashboardContent);
            dashboardContentEl.removeAttribute('hidden');
        });
    } else {
        dashboardContentEl.setAttribute('hidden', '');
        infoContentEl.removeAttribute('hidden');
    }
};

const hideModal = () => {
    const modal = document.getElementById('modal');
    modal.setAttribute('hidden', '');
};

const doSort = (data, sort) => {
    if (sort) {
        data.sort((a, b) => {
            if (sort.order === 'asc') {
                return a[sort.key] >= b[sort.key] ? 1 : -1;
            } else {
                return a[sort.key] >= b[sort.key] ? -1 : 1;
            }
        });
    }

    return data;
};


const getRows = (data, sortState, cb) => {
    const _data = doSort(data, sortState); 
    const _fields = new Set();

    for (const key in _data) {
        for (const field in _data[key]) {
            _fields.add(field);
        }
    }

    let _rows = [];

    for (const key in _data) {
        const row = document.createElement('tr');

        for (const field of _fields) {
            const obj = _data[key];
            const val = obj[field];
            
            const cell = document.createElement('td');
            
            if (cb) {
                row.className = 'clickable bluehover';
            }

            cell.onclick = () => {
                cb && cb(key, field);
            };

            cell.appendChild(simpleDiv(val));
            row.appendChild(cell);
        }

        _rows.push(row);
    }

    return _rows;
}

const sortableTable = (data, defaultSort, cb) => {
    const tableEl = document.createElement('table');
    const tHead = document.createElement('thead');
    const tBody = document.createElement('tbody');

    let sortState = Object.assign({}, defaultSort);

    const fields = new Set();
    for (const key in data) {
        for (const field in data[key]) {
            fields.add(field);
        }
    }

    const header = document.createElement('tr');

    const _fields = Array.from(fields);

    let rows = getRows(data, sortState, cb);

    for (const i in _fields) {
        const field = _fields[i];
        const headerCell = document.createElement('th');
        headerCell.className = 'clickable';
        
        headerCell.onclick = () => {
            if (sortState.key == field) {
                sortState.order = sortState.order === 'asc' ? 'desc' : 'asc';
            } else {
                sortState = { 
                    key: field,
                    order: 'asc'
                };
            }
            const newRows = getRows(data, sortState, cb);

            for (const i in rows) {
                const rowEl = rows[i];
                tBody.removeChild(rowEl);
            }

            rows = newRows;

            newRows.forEach(row => {
                tBody.appendChild(row);
            });

        };

        headerCell.appendChild(simpleDiv(field));

        header.appendChild(headerCell);
    }

    tHead.appendChild(header);

    rows.forEach(row => {
        tBody.appendChild(row);
    });


    tableEl.appendChild(tHead);
    tableEl.appendChild(tBody);

    return tableEl;
};

const goHome = () => {
    window.location.replace(`${location.protocol}//${location.hostname}:${location.port}`);
};


const handleDownload = (stable) => {
    showModal('download');
};
