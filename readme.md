## Application generates JSON backup file for all trello boards and downloads all file attachments according to each card
***  
### Setup project:
&emsp;`npm i`  
&emsp;`npm i chalk@4.0.0` 
   
&emsp;`npm i pkg -g`

### Run project:
&emsp;`node script.js`

### Generate trello API key and token [here](https://trello.com/app-key)

### Trello REST API [here](https://developer.atlassian.com/cloud/trello/rest/api-group-actions/)

### Create .exe file for win x64:  
&emsp;`pkg script.js --targets=latest-win-x64 --output node-trello-backup`  
### Create .exe file for win x86:  
&emsp;`pkg script.js --targets=latest-win-x86 --output node-trello-backup`
***