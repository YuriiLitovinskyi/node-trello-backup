const fs = require('fs');
const request = require('request');
require('dotenv').config();
const Trello = require('node-trello');
const chalk = require('chalk');

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

const d = new Date();
const year = d.getFullYear();
const month = d.getMonth() + 1;
const day = d.getDate();

const dir = `./trello_backup_${year}_${month}_${day}`;

const sleep = (timeout) => {
    return new Promise((resolve) => {
        setTimeout(resolve, timeout);        
    });
};

(async () => {
    try {
        if(!process.env.TRELLO_BACKUP_KEY){
            throw new Error('Trello backup key is required! Check .env file!');            
        };

        if(!process.env.TRELLO_BACKUP_TOKEN){
            throw new Error('Trello backup token is required! Check .env file!');
        };

        const trelloBackup = new Trello(process.env.TRELLO_BACKUP_KEY, process.env.TRELLO_BACKUP_TOKEN);

        console.log('Getting user and boards info...\n');

        const [user, allBoards] = await Promise.all([getTrelloUser(trelloBackup), getAllBoards(trelloBackup)]);
        
        console.log(`Using API key and token of: 
            ${user.fullName}, 
            ${user.username}, 
            ${user.email}`
        );
    
        console.log('\nBoards found: ', allBoards.length);   

        const boardsData = [];
        for(let i = 0; i < allBoards.length; i++){           
            boardsData.push(await getBoardData(trelloBackup, allBoards[i].id));
        };
      
        const jsonResult = await exportDataToJson(boardsData);
        console.log(chalk.yellow(jsonResult));          
   
        for(let i = 0; i < boardsData.length; i++){
            if(boardsData[i].prefs && boardsData[i].prefs.permissionLevel !== 'public'){
                console.log(chalk.redBright(`Cannot download files for board "${boardsData[i].name}". Board must be public!`));
                continue;
            };

            const boardPath = `${dir}/board_${boardsData[i].name}_${boardsData[i].id}`;
            if(!fs.existsSync(boardPath)){
                fs.mkdirSync(boardPath);
            };
           
            for(let j = 0; j < boardsData[i].cards.length; j++){
                const cardAttachments = await getAttachments(trelloBackup, boardsData[i].cards[j].id);               
                                      
                // download cards attachments
                if(cardAttachments.length){
                    for(let k = 0; k < cardAttachments.length; k++){
                        const cardPath = `${dir}/board_${boardsData[i].name}_${boardsData[i].id}/card_${boardsData[i].cards[j].name}_${boardsData[i].cards[j].id}`;
                        if(!fs.existsSync(cardPath)){
                            fs.mkdirSync(cardPath);
                        }; 

                        const downloadResult = await writeFile(cardAttachments[k], cardPath);
                        console.log(chalk.green(downloadResult));
                    };
                };       
            };
        };
        
        console.log('\nDone! Application will be closed in 30 seconds...');
        await sleep(30000);
    } catch (err) {
        console.log(chalk.red(err));
        await sleep(30000);
    };
})();

function getAllBoards(trelloObj){
    return new Promise((resolve, reject) => {
        trelloObj.get('/1/members/me/boards', async (err, data) => {
            if(err) reject(err);

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

function getAttachments(trelloObj, cardId){
    return new Promise((resolve, reject) => {
        trelloObj.get(`/1/cards/${cardId}/attachments`, (err, data) => {
            if(err) reject(err);

            resolve(data);
        });
    });
};

function exportDataToJson(data){
    return new Promise((resolve, reject) => {
        if(!fs.existsSync(dir)){
            fs.mkdirSync(dir);
        };
    
        fs.writeFile(
            `${dir}/trelloBackup_${year}_${month}_${day}.json`, 
            JSON.stringify(data, null, 2),
            (err) => {
                if(err) reject(err);             
                resolve('JSON backup file written!');
            }
        );
    });
};

function writeFile(attData, path){
    return new Promise((resolve, reject) => {
        request.head(attData.url, (err, res, body) => {
            if(err) reject(err);
        
            request(attData.url).pipe(fs.createWriteStream(`${path}/${attData.name}`)).on('close', () => {            
                resolve(`Downloading file "${attData.name}"`);
            });
        });
    });
};