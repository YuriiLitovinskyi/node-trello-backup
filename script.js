const fs = require('fs');
require('dotenv').config();
const Trello = require('node-trello');

const trelloBackup = new Trello(process.env.TRELLO_BACKUP_KEY, process.env.TRELLO_BACKUP_TOKEN);

const options = {
    actions: 'all',
    actions_limit: '1000',
    cards: 'all', 
    lists: 'all',
    members: 'all',
    member_fields: 'all',
    checklists: 'all',
    fields: 'all'
};


(async () => {
    try {
        const user = await getTrelloUser(trelloBackup);
        console.log(`Using API key and token of: 
            ${user.fullName}, 
            ${user.username}, 
            ${user.email}`
        );

        const allBoards = await getAllBoards(trelloBackup);   

        const boardsData = [];
        for(let i = 0; i < allBoards.length; i++){           
            boardsData.push(await getBoardData(trelloBackup, allBoards[i].id));
        };
      
        exportDataToJson(boardsData);        
        
    } catch (err) {
        console.log(err);
        await sleep(30000);
    };
})();


function getAllBoards(trelloObj){
    return new Promise((resolve, reject) => {
        trelloObj.get('/1/members/me/boards', async (err, data) => {
            if(err) reject(err);

            console.log('\nBoards found: ', data.length);

            resolve(data);
        });
    });
};


function getTrelloUser(trelloObj){
    return new Promise((resolve, reject) => {
        trelloObj.get('/1/members/me', (err, data) => {
            if(err) reject(err);
        
            resolve(data);
        });
    });
};

function getBoardData(trelloObj, boardId){
    return new Promise((resolve, reject) => {
        trelloObj.get(`/1/boards/${boardId}`, options, (err, data) => {
            if(err) reject(err);
        
            console.log(`Getting board "${data.name}" data...`);
           
            resolve(data);
        });
    });
};

function exportDataToJson(data){
    const d = new Date();
    fs.writeFile(
        `trelloBackup_${d.getFullYear()}_${(d.getMonth() + 1)}_${d.getDate()}.json`, 
        JSON.stringify(data, null, 2), 
        async (err) => {
            if(err) throw err;
            
            console.log('\nJSON backup file written!');
            console.log('Application will be closed in 30 seconds...');
            await sleep(30000);
        }
    );
};

const sleep = (timeout) => {
    return new Promise((resolve) => {
        setTimeout(resolve, timeout);        
    });
};